import { validateSectionHeaders, validateAcronymUsage, validateSectionLength, validateHIPAACompliance } from './validators';
import { formatResponse } from './formatter';
import { SESSION_SECTIONS, ASSESSMENT_SECTIONS } from './constants';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function processResponse(content: string, isAssessment: boolean): string {
  // Initial formatting
  let processedContent = formatResponse(content, isAssessment);

  // Validate the formatted content
  const validation = validateResponse(processedContent, isAssessment);

  if (!validation.isValid) {
    console.warn('Response validation warnings:', validation.errors);
  }

  return processedContent;
}

function validateResponse(content: string, isAssessment: boolean): ValidationResult {
  const errors: string[] = [];

  // Validate section headers
  if (!validateSectionHeaders(content, isAssessment)) {
    errors.push('Missing required sections');
  }

  // Validate acronym usage for session notes
  if (!isAssessment && !validateAcronymUsage(content)) {
    errors.push('Missing required acronyms (TH/CL)');
  }

  // Validate HIPAA compliance
  if (!validateHIPAACompliance(content)) {
    errors.push('Potential HIPAA compliance issues detected');
  }

  // Validate section lengths
  const sections = isAssessment ? ASSESSMENT_SECTIONS : SESSION_SECTIONS;
  sections.forEach(section => {
    const sectionRegex = new RegExp(`${section}:[^]*?(?=${sections.join(':|')}:|$)`);
    const sectionContent = content.match(sectionRegex)?.[0] || '';
    
    if (!validateSectionLength(sectionContent)) {
      errors.push(`Section "${section}" exceeds maximum length`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}