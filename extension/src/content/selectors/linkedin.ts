export const LinkedInSelectors = {
  // Job listing page selectors
  jobCard: 'div[data-job-id]',
  jobTitle: 'a.job-card-list__title',
  jobCompany: 'a.job-card-container__company-name',
  jobLocation: 'span.job-card-container__metadata-item',
  jobDescription: 'div.job-card-list__description',
  
  // Job detail page selectors
  detailTitle: 'h1.top-card-layout__title',
  detailCompany: 'a.topcard__org-name-link',
  detailLocation: 'span.topcard__flavor--bullet',
  detailDescription: 'div.show-more-less-html__markup',
  
  // Alternative selectors (LinkedIn changes their DOM frequently)
  altJobCard: 'div.job-search-card',
  altJobTitle: 'h3.base-search-card__title a',
  altJobCompany: 'h4.base-search-card__subtitle a',
  altJobLocation: 'span.job-search-card__location',
  
  // Detection selectors
  isJobListingPage: () => {
    return window.location.pathname.includes('/jobs/') && 
           !window.location.pathname.includes('/jobs/view/')
  },
  
  isJobDetailPage: () => {
    return window.location.pathname.includes('/jobs/view/')
  },
}

