Security Policy

Supported Versions

The following versions of the Railnology project are currently being supported with security updates.

Version

Supported

3.x

:white_check_mark:

2.x

:x:

Technology Stack & Vulnerability Context

Railnology utilizes a MERN-like architecture with Vite as the build tool.

Frontend: React (Client-Side Rendering via Vite)

Backend: Node.js + Express

Database: MongoDB Atlas

CVE-2025-55182 (Next.js RCE)

Status: Not Affected.
Reasoning: This application does not use Next.js or React Server Components. It uses a standard Client-Side React SPA architecture served via Vite.

Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an e-mail to security@railnology.com. All security vulnerabilities will be promptly addressed.

Deployment Security

Production: Hosted on Vercel (Frontend) and Render (Backend).

Secrets: All API keys and database URIs are managed via Environment Variables.

Headers: The X-Powered-By header is disabled to obfuscate server details.