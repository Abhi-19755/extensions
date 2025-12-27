/**
 * Utility functions for parsing and processing job descriptions and resumes
 * This module can be extended for more advanced parsing features
 */

/**
 * Extract skills from text using common patterns
 * @param {string} text - Text to extract skills from
 * @returns {Array<string>} - Array of extracted skills
 */
function extractSkillsFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const skills = [];
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Azure',
    'Docker', 'Kubernetes', 'Git', 'CI/CD', 'REST API', 'GraphQL',
    'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
    'HTML', 'CSS', 'TypeScript', 'Redux', 'Webpack', 'Babel'
  ];

  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(lowerText)) {
      skills.push(skill);
    }
  });

  return [...new Set(skills)]; // Remove duplicates
}

/**
 * Clean and normalize text
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .trim();
}

/**
 * Extract job requirements section from job description
 * @param {string} jobDescription - Full job description
 * @returns {string} - Requirements section if found
 */
function extractRequirements(jobDescription) {
  if (!jobDescription) {
    return '';
  }

  const requirementKeywords = [
    'requirements',
    'qualifications',
    'must have',
    'required',
    'essential',
    'minimum requirements'
  ];

  const lines = jobDescription.split('\n');
  let requirementsStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (requirementKeywords.some(keyword => line.includes(keyword))) {
      requirementsStart = i;
      break;
    }
  }

  if (requirementsStart !== -1) {
    return lines.slice(requirementsStart).join('\n');
  }

  return jobDescription; // Return full description if no requirements section found
}

/**
 * Calculate word count
 * @param {string} text - Text to count words in
 * @returns {number} - Word count
 */
function getWordCount(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Extract years of experience mentioned in text
 * @param {string} text - Text to search
 * @returns {number|null} - Years of experience or null if not found
 */
function extractYearsOfExperience(text) {
  if (!text) {
    return null;
  }

  const patterns = [
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
    /(\d+)\+?\s*yrs?\s*(?:of\s*)?exp/gi,
    /experience[:\s]+(\d+)\+?\s*years?/gi
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[0].match(/\d+/)[0], 10);
      return years;
    }
  }

  return null;
}

// Export functions (for use in other scripts if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractSkillsFromText,
    cleanText,
    extractRequirements,
    getWordCount,
    extractYearsOfExperience
  };
}

