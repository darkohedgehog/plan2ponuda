# Feature: Quote Generation

## Feature Goal

Generate a full installation quote from project data.

---

# User Story

As an electrician,

I want a generated quote,

So I can send a professional installation offer to my client.

---

# Entry Point

Route:

/dashboard/projects/[projectId]/quote

---

# Quote Content

Client Name  
Project Name  
Object Type  
Area

Room summary

Material list

Labor cost

Total price

---

# Price Calculation

Material Cost

Sum of all project materials.

Labor Cost

Estimated from project size.

Example:

areaM2 * laborFactor

Total

materialCost + laborCost

---

# UI Requirements

Quote summary page showing:

Materials  
Labor  
Subtotal  
Total

Buttons:

Generate PDF  
Edit Materials

---

# Database

Table:

Quote

Fields:

laborCost  
materialCost  
subtotal  
total  
pdfPath

---

# Service Layer

File:

quote-service.ts

Functions:

generateQuote()

calculateLaborCost()

---

# Success Result

Quote saved in database.

User can export quote as PDF.