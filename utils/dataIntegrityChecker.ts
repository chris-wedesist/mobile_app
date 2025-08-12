// React Native compatible data integrity checker
// This utility can be used to verify that no dummy data is being used in the app

export const SUSPICIOUS_TERMS = [
  'fallback',
  'dummy',
  'mock',
  'fake',
  'sample',
  'placeholder',
  'FALLBACK_ATTORNEYS'
];

export interface DataIntegrityFinding {
  file: string;
  term: string;
  line: number;
  context: string;
}

export interface DataIntegrityReport {
  isClean: boolean;
  findings: DataIntegrityFinding[];
  summary: string;
}

/**
 * Check a specific file content for suspicious terms
 * This can be used to verify individual files or code strings
 */
export const checkFileContent = (
  content: string,
  fileName: string = 'unknown'
): DataIntegrityFinding[] => {
  const findings: DataIntegrityFinding[] = [];
  const lines = content.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    for (const term of SUSPICIOUS_TERMS) {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        findings.push({
          file: fileName,
          term,
          line: lineIndex + 1,
          context: line.trim()
        });
      }
    }
  }
  
  return findings;
};

/**
 * Check multiple files and generate a report
 */
export const checkMultipleFiles = (
  files: { name: string; content: string }[]
): DataIntegrityReport => {
  const allFindings: DataIntegrityFinding[] = [];
  
  for (const file of files) {
    const findings = checkFileContent(file.content, file.name);
    allFindings.push(...findings);
  }
  
  const isClean = allFindings.length === 0;
  const summary = isClean 
    ? '✅ No suspicious terms found. Your codebase appears clean!'
    : `❌ Found ${allFindings.length} suspicious references that need attention.`;
  
  return {
    isClean,
    findings: allFindings,
    summary
  };
};

/**
 * Check specific code patterns that might indicate dummy data usage
 */
export const checkForDummyDataPatterns = (content: string): DataIntegrityFinding[] => {
  const patterns = [
    // Check for hardcoded attorney data
    { pattern: /const.*attorneys.*=.*\[/, term: 'hardcoded_attorneys' },
    { pattern: /return.*\[.*\{.*name.*:.*['"]/, term: 'inline_attorney_data' },
    { pattern: /FALLBACK_ATTORNEYS/, term: 'FALLBACK_ATTORNEYS' },
    { pattern: /mock.*attorney/i, term: 'mock_attorney' },
    { pattern: /fake.*attorney/i, term: 'fake_attorney' },
    { pattern: /dummy.*attorney/i, term: 'dummy_attorney' },
    { pattern: /sample.*attorney/i, term: 'sample_attorney' },
  ];
  
  const findings: DataIntegrityFinding[] = [];
  const lines = content.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    for (const { pattern, term } of patterns) {
      if (pattern.test(line)) {
        findings.push({
          file: 'code_check',
          term,
          line: lineIndex + 1,
          context: line.trim()
        });
      }
    }
  }
  
  return findings;
};

/**
 * Generate a comprehensive data integrity report
 */
export const generateDataIntegrityReport = (
  files: { name: string; content: string }[]
): DataIntegrityReport => {
  const basicFindings = checkMultipleFiles(files);
  const patternFindings: DataIntegrityFinding[] = [];
  
  // Additional pattern checks
  for (const file of files) {
    const patterns = checkForDummyDataPatterns(file.content);
    patterns.forEach(finding => {
      finding.file = file.name;
    });
    patternFindings.push(...patterns);
  }
  
  const allFindings = [...basicFindings.findings, ...patternFindings];
  const isClean = allFindings.length === 0;
  
  const summary = isClean 
    ? '✅ Data integrity check passed. No dummy data detected.'
    : `❌ Data integrity check failed. Found ${allFindings.length} suspicious references.`;
  
  return {
    isClean,
    findings: allFindings,
    summary
  };
};

/**
 * Log findings in a readable format
 */
export const logDataIntegrityFindings = (findings: DataIntegrityFinding[]): void => {
  if (findings.length === 0) {
    console.log('✅ No suspicious terms found. Your codebase appears clean!');
    return;
  }
  
  console.log(`❌ Found ${findings.length} suspicious references:`);
  findings.forEach(({ file, term, line, context }) => {
    console.log(`- ${file}:${line} - contains term "${term}"`);
    console.log(`  Context: ${context}`);
  });
}; 