# FairShare - Itinerary calendar update

## What changed
- Calendar reads `tripId` from the URL (`itinerary.html?tripId=2`)
- It uses `GET /trips` to find that trip's name and starting month
- It uses Loren's existing `GET /loadEvents?tripId=2` to display events
- Events with a start and end date appear on every day of their date range
- Previous / Next / Today, the Month view, and the small `+` buttons are kept
- The `+` buttons are still a placeholder, not a new event form
