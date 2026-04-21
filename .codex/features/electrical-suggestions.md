# Feature: Electrical Suggestions

## Feature Goal

Generate electrical installation suggestions for each room.

Suggestions include:

sockets  
switches  
lighting points

---

# User Story

As an electrician,

I want suggested electrical points for each room,

So I can quickly estimate installation requirements.

---

# Entry Point

Project Workflow

Route:

/dashboard/projects/[projectId]/review

Suggestions appear next to each room.

---

# Suggestion Rules

Example:

Kitchen

6 sockets  
2 switches  
2 lights

Living room

5 sockets  
2 switches  
2 lights

Bedroom

3 sockets  
1 switch  
1 light

Bathroom

2 sockets  
1 switch  
1 light

---

# UI Requirements

For each room display:

Suggested Sockets  
Suggested Switches  
Suggested Lights

User editable fields:

Sockets  
Switches  
Lights

---

# Backend Logic

Steps:

1. Read room types
2. Apply rule engine
3. Generate default suggestions
4. Save suggestions

---

# Database

Table:

RoomSuggestion

Fields:

suggestedSockets  
suggestedSwitches  
suggestedLights

User overrides:

userSockets  
userSwitches  
userLights

---

# Service Layer

File:

room-rules.ts

Functions:

generateRoomSuggestions()

---

# Success Result

Each room has editable electrical suggestions.