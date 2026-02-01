export const NaukriSelectors = {
  // Job listing page selectors
  jobCard: 'div[data-job-id]',
  jobTitle: 'a.title',
  jobCompany: 'a.subTitle',
  jobLocation: 'span.locWdth',
  jobDescription: 'span.desc',
  
  // Job detail page selectors
  detailTitle: 'h1[itemprop="title"]',
  detailCompany: 'a[itemprop="hiringOrganization"]',
  detailLocation: 'span[itemprop="jobLocation"]',
  detailDescription: 'div[itemprop="description"]',
  
  // Alternative selectors
  altJobCard: 'div.row',
  altJobTitle: 'a.title.fw500',
  altJobCompany: 'a.subTitle.ellipsis',
  altJobLocation: 'span.locWdth',
  
  // Detection selectors
  isJobListingPage: () => {
    return window.location.pathname.includes('/job-listings') ||
           window.location.pathname.includes('/jobs/')
  },
  
  isJobDetailPage: () => {
    return window.location.pathname.includes('/job-details/')
  },
}

