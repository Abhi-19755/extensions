/**
 * Content Script for Resume Scanner Extension
 * Extracts job description from Naukri and Indeed job listing pages
 */

(function() {
  'use strict';

  // Platform detection
  const PLATFORMS = {
    NAUKRI: 'naukri',
    INDEED: 'indeed'
  };

  let currentPlatform = null;
  let extractedJobData = null;

  /**
   * Initialize content script
   */
  function init() {
    detectPlatform();

    // Bail early on non-HTTP(S) pages (e.g. chrome://newtab) or when hostname is missing
    try {
      const proto = window.location && window.location.protocol;
      const host = window.location && window.location.hostname;
      if (!proto || !/^https?:/.test(proto) || !host) {
        console.warn('Resume Scanner: Unsupported page protocol or hostname', window.location.href);
        return;
      }
    } catch (e) {
      console.warn('Resume Scanner: Could not determine page protocol/hostname', e);
      return;
    }

    if (currentPlatform) {
      extractJobData();
      setupObserver();
    } else {
      console.warn('Resume Scanner: Unsupported page');
    }
  }

  /**
   * Detect which job portal we're on
   */
  function detectPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('naukri.com')) {
      currentPlatform = PLATFORMS.NAUKRI;
    } else if (hostname.includes('indeed.com')) {
      currentPlatform = PLATFORMS.INDEED;
    }
  }

  /**
   * Extract job data based on current platform
   */
  function extractJobData() {
    switch (currentPlatform) {
      case PLATFORMS.NAUKRI:
        extractedJobData = extractNaukriJobData();
        break;
      case PLATFORMS.INDEED:
        extractedJobData = extractIndeedJobData();
        break;
      default:
        extractedJobData = null;
    }

    if (extractedJobData && extractedJobData.description) {
      sendJobDataToBackground(extractedJobData);
    }
  }

  /**
   * Extract job data from Naukri.com
   */
  function extractNaukriJobData() {
    try {
      // Job title selectors (expanded list for Naukri)
      const titleSelectors = [
        '.jd-header-title',
        'h1.jobTitle',
        '.job-title',
        'h1[itemprop="title"]',
        '.title',
        'h1',
        '.jobTitle',
        '[class*="job-title"]',
        '[class*="jobTitle"]',
        'h1.jd-header-title',
        '.jd-header h1',
        '.job-header h1',
        'h1[class*="title"]',
        '.job-detail h1',
        '.jobDetail h1'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim() || element.innerText?.trim() || '';
            if (text && text.length > 0 && text.length < 200) { // Reasonable title length
              title = text;
              console.log('Resume Scanner: Found job title using selector:', selector);
              break;
            }
          }
        } catch (selectorError) {
          // Skip problematic selectors
          continue;
        }
      }

      // Job description selectors (expanded list for Naukri)
      const descriptionSelectors = [
        '.jd-desc',
        '.job-description',
        '#jobDescriptionText',
        '.description',
        '[data-testid="job-description"]',
        '.jd-container',
        '.jobDesc',
        '.job-description-text',
        '[class*="jobDescription"]',
        '[class*="job-description"]',
        '[id*="jobDescription"]',
        '[id*="job-description"]',
        '.jd-sec',
        '.job-details',
        '.jobDetail',
        '.jobDescText',
        '.jd-text',
        '[class*="JD"]',
        '[class*="jd"]',
        'div[itemprop="description"]',
        '.job-summary',
        '.summary'
      ];
      
      let description = '';
      for (const selector of descriptionSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim() || element.innerText?.trim() || '';
            // Ensure we got meaningful content (at least 50 characters)
            if (text && text.length > 50) {
              description = text;
              console.log('Resume Scanner: Found job description using selector:', selector);
              break;
            }
          }
        } catch (selectorError) {
          // Skip problematic selectors
          continue;
        }
      }
      
      // Fallback: Try to find any large text block that might contain job description
      if (!description) {
        try {
          // Look for common job description patterns in the page (limit search scope)
          const mainContent = document.querySelector('main, [role="main"], .main-content, #main, .content') || document.body;
          const candidateElements = mainContent.querySelectorAll('div[class*="desc"], div[class*="detail"], div[class*="jd"], section, article');
          
          // Limit to first 50 elements to avoid performance issues
          const maxElements = Math.min(50, candidateElements.length);
          
          for (let i = 0; i < maxElements; i++) {
            try {
              const el = candidateElements[i];
              if (!el) continue;
              
              const text = el.textContent?.trim() || el.innerText?.trim() || '';
              
              // Look for text blocks that contain common job description keywords
              if (text && text.length > 200 && 
                  (text.toLowerCase().includes('project role') || 
                   text.toLowerCase().includes('job description') ||
                   text.toLowerCase().includes('responsibilities') ||
                   text.toLowerCase().includes('requirements') ||
                   text.toLowerCase().includes('must have') ||
                   text.toLowerCase().includes('good to have'))) {
                description = text;
                console.log('Resume Scanner: Found job description using fallback method');
                break;
              }
            } catch (elError) {
              // Skip problematic elements
              continue;
            }
          }
        } catch (fallbackError) {
          console.warn('Resume Scanner: Fallback extraction failed', fallbackError);
        }
      }

      // --- Additional fallbacks: JSON-LD, meta tags, and heading-based extraction ---
      if (!description) {
        try {
          // 1) JSON-LD structured data (JobPosting)
          const ldJsonScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
          for (const s of ldJsonScripts) {
            try {
              const json = JSON.parse(s.textContent || s.innerText || '{}');
              // JSON-LD can be an array or object
              const candidates = Array.isArray(json) ? json : [json];
              for (const item of candidates) {
                const type = item['@type'] || item['type'];
                if (type && type.toLowerCase && type.toLowerCase().includes('job')) {
                  const desc = item.description || item.jobDescription || item.text;
                  if (desc && desc.trim().length > 50) {
                    description = (typeof desc === 'string') ? desc.trim() : JSON.stringify(desc);
                    console.log('Resume Scanner: Found job description via JSON-LD');
                    break;
                  }
                }
              }
              if (description) break;
            } catch (e) {
              continue;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      if (!description) {
        try {
          // 2) Meta description / Open Graph
          const metaDesc = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
          if (metaDesc && metaDesc.content && metaDesc.content.trim().length > 50) {
            description = metaDesc.content.trim();
            console.log('Resume Scanner: Found job description via meta description');
          }
        } catch (e) {}
      }

      if (!description) {
        try {
          // 3) Heading-based extraction: look for headings that indicate job description
          const headingSelectors = 'h1,h2,h3,h4,span,strong,b';
          const headingNodes = Array.from(document.querySelectorAll(headingSelectors));
          for (const h of headingNodes) {
            try {
              const txt = (h.textContent || '').trim().toLowerCase();
              if (!txt) continue;
              if (txt.includes('job description') || txt.includes('about the role') || txt.includes('responsibilities') || txt.includes('what you will do') || txt.includes('key responsibilities')) {
                // prefer next sibling block
                let candidate = h.nextElementSibling || h.parentElement && h.parentElement.querySelector('p,div');
                if (candidate) {
                  const t = (candidate.textContent || candidate.innerText || '').trim();
                  if (t && t.length > 50) {
                    description = t;
                    console.log('Resume Scanner: Found job description via heading fallback');
                    break;
                  }
                }
              }
            } catch (e) { continue; }
          }
        } catch (e) {}
      }

      // Skills extraction (if available)
      const skillsSelectors = [
        '.key-skill',
        '.skills',
        '.job-skill',
        '[data-testid="skills"]',
        '.skill',
        '[class*="skill"]'
      ];
      
      const skills = [];
      for (const selector of skillsSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach(el => {
              try {
                const skillText = el.textContent?.trim() || el.innerText?.trim() || '';
                if (skillText && skillText.length < 50) { // Reasonable skill length
                  skills.push(skillText);
                }
              } catch (elError) {
                // Skip problematic elements
              }
            });
            if (skills.length > 0) break;
          }
        } catch (selectorError) {
          // Skip problematic selectors
          continue;
        }
      }

      if (!description) {
        console.warn('Resume Scanner: Could not extract job description from Naukri');
        return null;
      }

      return {
        title: title || 'Job Listing',
        description: description,
        skills: skills,
        source: PLATFORMS.NAUKRI,
        url: window.location.href
      };
    } catch (error) {
      console.error('Resume Scanner: Error extracting Naukri job data', error);
      return null;
    }
  }

  /**
   * Extract job data from Indeed.com
   */
  function extractIndeedJobData() {
    try {
      // Job title selectors
      const titleSelectors = [
        'h2.jobTitle',
        '.jobsearch-JobInfoHeader-title',
        'h1[data-testid="job-title"]',
        '.jobTitle'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          title = element.textContent.trim();
          break;
        }
      }

      // Job description selectors
      const descriptionSelectors = [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '[data-testid="job-description"]',
        '.job-description'
      ];
      
      let description = '';
      for (const selector of descriptionSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          description = element.textContent.trim() || element.innerText.trim();
          break;
        }
      }

      // Skills extraction (Indeed often lists skills in job description)
      const skills = [];
      // Try to find skills section if it exists
      const skillsSection = document.querySelector('[data-testid="skills-section"]') ||
                           document.querySelector('.skills-section');
      if (skillsSection) {
        const skillElements = skillsSection.querySelectorAll('span, li, .skill');
        skillElements.forEach(el => {
          const skillText = el.textContent.trim();
          if (skillText && skillText.length < 50) { // Reasonable skill length
            skills.push(skillText);
          }
        });
      }

      if (!description) {
        console.warn('Resume Scanner: Could not extract job description from Indeed');
        return null;
      }

      return {
        title: title || 'Job Listing',
        description: description,
        skills: skills,
        source: PLATFORMS.INDEED,
        url: window.location.href
      };
    } catch (error) {
      console.error('Resume Scanner: Error extracting Indeed job data', error);
      return null;
    }
  }

  /**
   * Send extracted job data to background script
   */
  function sendJobDataToBackground(jobData) {
    try {
      chrome.runtime.sendMessage({
        type: 'JOB_DATA_EXTRACTED',
        jobData: jobData
      }, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.error('Resume Scanner: Error sending job data to background', err);
        }
      });
    } catch (err) {
      console.error('Resume Scanner: Error sending job data to background', err);
    }
  }

  /**
   * Setup MutationObserver to detect dynamic content changes
   */
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldReExtract = false;
      
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0 || mutation.type === 'childList') {
          shouldReExtract = true;
        }
      });
      
      if (shouldReExtract) {
        // Debounce re-extraction
        clearTimeout(window.reExtractTimeout);
        window.reExtractTimeout = setTimeout(() => {
          extractJobData();
        }, 1000);
      }
    });

    // Observe changes to the document body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also try extraction after a short delay for dynamic content
  setTimeout(init, 2000);

})();

