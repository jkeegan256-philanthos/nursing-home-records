# Monthly data

Nothing needs to be uploaded here. The GitHub Action downloads the
current CMS nursing homes theme zip on every run, so the monthly
refresh is one tap: Actions, Build and deploy, Run workflow. A
scheduled run also tries on the 5th of each month.

If a zip is committed in this folder, the Action uses it instead of
downloading, which pins the site to that exact batch. Note that
GitHub's browser upload caps files at 25 MB and the real zip is about
37 MB, so committing one requires the command line. For local work,
`npm run fixture` generates a small synthetic batch instead.

Current zip URL, for reference:
https://data.cms.gov/provider-data/sites/default/files/dataset-archives/current/theme/theme_nursing-homes_current.zip
