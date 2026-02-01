export const IndeedSelectors = {
  // Job listing page selectors
  jobCard: 'div[data-jk]',
  jobTitle: 'h2.jobTitle a',
  jobCompany: 'span[data-testid="company-name"]',
  jobLocation: 'div[data-testid="text-location"]',
  jobDescription: 'div.job-snippet',
  
  // Job detail page selectors
  detailTitle: 'h2.jobsearch-JobInfoHeader-title',
  detailCompany: 'div[data-testid="inlineHeader-companyName"]',
  detailLocation: 'div[data-testid="job-location"]',
  detailDescription: 'div#jobDescriptionText',
  
  // Alternative selectors
  altJobCard: 'td.resultContent',
  altJobTitle: 'h2.jobTitle a',
  altJobCompany: 'span.companyName',
  altJobLocation: 'div.companyLocation',
  
  // Detection selectors
  isJobListingPage: () => {
    return window.location.pathname === '/jobs' || 
           window.location.pathname.startsWith('/viewjob')
  },
  
  isJobDetailPage: () => {
    return window.location.pathname.startsWith('/viewjob')
  },
}

