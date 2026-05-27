ScopeLock — Stop Scope Creep Before It Starts

Overview
A web-based Change Request management system that helps freelancers and agencies lock project scope, track change requests, and prevent scope creep.

Problem
Clients constantly ask for "small changes" that pile up, derailing timelines and budgets. Without a formal system, freelancers lose money tracking these changes manually or forget to
bill for them.

Solution
Built a single-page app where users create projects with a locked scope baseline, log every change request with impact assessment, approve/reject changes, track budget drift, and 
generate invoices — all in one place.

Tools Used
- React (CDN, no build step)
- Supabase (Auth + Database + Edge Functions)
- Payhip (Payment processing)
- Babel (In-browser JSX transpilation)
- HTML / CSS / JavaScript
- GitHub

Features
- User login (email/password + Google OAuth)
- Project dashboard with drift analytics
- Change Request logging with priority and impact
- Approve / Reject CRs with rejection reasons
- Invoice generator with PDF print
- Client share links (read-only)
- Budget tracking and drift percentage
- Dark mode
- Realtime sync via Supabase
- Keyboard shortcuts

Result
Replaced chaotic email/chat-based scope changes with a structured system. Every client request is documented, costed, and tracked — no more lost revenue from undocumented changes.

Github Repository
https://github.com/raejohnacarandang/scopelock

Live Demo
https://raejohnacarandang.github.io/scopelock/
