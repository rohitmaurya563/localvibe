import './App.css'
import { useEffect, useState } from 'react'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [goingEvents, setGoingEvents] = useState([])
  const [interestedEvents, setInterestedEvents] = useState([])
  const [userId] = useState(() => {
  const key = 'localvibe-demo-user-id'
  let id = localStorage.getItem(key)

  if (!id) {
    id = `guest-${crypto.randomUUID()}`
    localStorage.setItem(key, id)
  }

  return id
})
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [locationMessage, setLocationMessage] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    place: '',
    category: 'MUSIC',
  })

  const [events, setEvents] = useState([
    {
      title: 'Live Music Night',
      date: 'OCT 18 · 6:00 PM',
      place: 'City Community Hall',
      distance: 'Within 2 km',
      attendees: 24,
      seatsLeft: 16,
      category: 'MUSIC',
      emoji: '🎸',
      style: 'music-image',
    },
    {
      title: 'Local Food Festival',
      date: 'OCT 19 · 12:00 PM',
      place: 'Central Market',
      distance: 'Within 3 km',
      attendees: 56,
      seatsLeft: 12,
      category: 'FOOD',
      emoji: '🍕',
      style: 'food-image',
    },
    {
      title: 'Weekend Art Workshop',
      date: 'OCT 20 · 4:00 PM',
      place: 'Creative Studio',
      distance: 'Within 4 km',
      attendees: 18,
      seatsLeft: 8,
      category: 'ART',
      emoji: '🎨',
      style: 'art-image',
    },
  ])

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch("http://localhost:5000/api/events");

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Invalid events response");
        }

        const categoryVisuals = {
          MUSIC: { emoji: "🎸", style: "music-image" },
          FOOD: { emoji: "🍕", style: "food-image" },
          ART: { emoji: "🎨", style: "art-image" },
          SPORTS: { emoji: "⚽", style: "music-image" },
          SOCIAL: { emoji: "☕", style: "music-image" },
        };

        const databaseEvents = result.data.map((event) => {
          const storedCategory = String(event.category || "SOCIAL")
            .toUpperCase();

          const category = categoryVisuals[storedCategory]
            ? storedCategory
            : "SOCIAL";

          const eventDate = new Date(event.date);

          const formattedDate = Number.isNaN(eventDate.getTime())
            ? "Date to be announced"
            : `${eventDate
                .toLocaleString("en-US", { month: "short" })
                .toUpperCase()} ${eventDate.getDate()}${
                event.time ? ` · ${event.time}` : ""
              }`;

       
return {
  ...event,
  date: formattedDate,
  place: event.location || "Location not specified",
  distance: "Location not verified",
  attendees: Array.isArray(event.goingUsers)
    ? event.goingUsers.length
    : 0,
  seatsLeft: 50,
  category,
  ...categoryVisuals[category],
};
});


        setEvents(databaseEvents);
        setGoingEvents(
  databaseEvents
    .filter(
      (event) =>
        Array.isArray(event.goingUsers) &&
        event.goingUsers.includes(userId)
    )
    .map((event) => event.title)
)
        console.log("Events loaded from MongoDB:", databaseEvents);
      } catch (error) {
        console.error("Error loading LocalVibe events:", error);
      }
    }

    fetchEvents();
  }, [userId])

  const filteredEvents = events.filter((event) => {
    const matchesSearch = `${event.title} ${event.place} ${event.category}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase().trim())

    const matchesCategory =
      selectedCategory === 'All' || event.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  
const toggleGoing = async (event) => {
  if (!event._id) {
    alert("Event database mein nahi mila. Page refresh karke try karo.");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/events/${event._id}/going`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Going status save nahi hua");
    }

    setGoingEvents((previous) =>
      result.going
        ? previous.includes(event.title)
          ? previous
          : [...previous, event.title]
        : previous.filter((title) => title !== event.title)
    );

    const updateEvent = (item) => {
      if (item._id !== event._id) return item;

      const users = Array.isArray(item.goingUsers)
        ? item.goingUsers
        : [];

      const goingUsers = result.going
        ? [...new Set([...users, userId])]
        : users.filter((id) => id !== userId);

      return {
        ...item,
        goingUsers,
        attendees: result.goingCount,
      };
    };

    setEvents((previous) => previous.map(updateEvent));

    setSelectedEvent((previous) =>
      previous && previous._id === event._id
        ? updateEvent(previous)
        : previous
    );
  } catch (error) {
    console.error("Going status error:", error);
    alert("Going status save nahi hua. Backend aur terminal check karo.");
  }
};

const toggleInterested = (eventId) => {
  setInterestedEvents((previous) =>
    previous.includes(eventId)
      ? previous.filter((id) => id !== eventId)
      : [...previous, eventId]
  )
}


  const findMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser.')
      return
    }

    setLocationMessage('Requesting location permission...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(4)
        const longitude = position.coords.longitude.toFixed(4)
        setLocationMessage(`Location found: ${latitude}, ${longitude}`)
      },
      () => {
        setLocationMessage(
          'Location access was denied or unavailable. You can allow it in browser settings.'
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#home" aria-label="LocalVibe home">
          Local<span>Vibe.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#events">Explore Events</a>
          <a href="#about">About</a>
        </div>

        <button className="location-btn" onClick={findMyLocation}>
          📍 Discover nearby
        </button>
      </nav>

      {locationMessage && (
        <div className="location-message" role="status">
          {locationMessage}
        </div>
      )}

      <main className="hero" id="home">
        <p className="tagline">YOUR CITY, YOUR COMMUNITY</p>

        <h1>
          Find your next <span>favorite</span> thing.
        </h1>

        <p className="description">
          Discover local events, meet amazing people, and experience what's
          happening around you.
        </p>

        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search events, places, activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search events"
          />
          <button onClick={() => setSearchTerm(searchTerm.trim())}>
            Explore
          </button>
        </div>

        <div className="categories" aria-label="Filter events by category">
          <button
            className={selectedCategory === 'All' ? 'active' : ''}
            onClick={() => setSelectedCategory('All')}
          >
            🌟 All
          </button>
          <button
            className={selectedCategory === 'MUSIC' ? 'active' : ''}
            onClick={() => setSelectedCategory('MUSIC')}
          >
            🎵 Music
          </button>
          <button
            className={selectedCategory === 'FOOD' ? 'active' : ''}
            onClick={() => setSelectedCategory('FOOD')}
          >
            🍕 Food
          </button>
          <button
            className={selectedCategory === 'ART' ? 'active' : ''}
            onClick={() => setSelectedCategory('ART')}
          >
            🎨 Art
          </button>
          <button
            className={selectedCategory === 'SPORTS' ? 'active' : ''}
            onClick={() => setSelectedCategory('SPORTS')}
          >
            ⚽ Sports
          </button>
          <button
            className={selectedCategory === 'SOCIAL' ? 'active' : ''}
            onClick={() => setSelectedCategory('SOCIAL')}
          >
            ☕ Social
          </button>
        </div>

        <section className="events-section" id="events">
          <div className="section-heading">
            <div>
              <p className="tagline">HAPPENING AROUND YOU</p>
              <h2>Upcoming Events</h2>
              <button
                type="button"
                className="create-event-btn"
                onClick={() => setShowCreateForm((show) => !show)}
              >
                {showCreateForm ? '✕ Close Form' : '+ Create Event'}
              </button>
            </div>
            <p className="event-note">Discover something new today ✨</p>
          </div>

          {showCreateForm && (
            <form
              className="create-event-form"
              
onSubmit={async (e) => {
  e.preventDefault();

  const categoryStyles = {
    MUSIC: { emoji: "🎸", style: "music-image" },
    FOOD: { emoji: "🍕", style: "food-image" },
    ART: { emoji: "🎨", style: "art-image" },
    SPORTS: { emoji: "⚽", style: "music-image" },
    SOCIAL: { emoji: "☕", style: "music-image" },
  };

  try {
    const eventDate = new Date(newEvent.date);

    const response = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newEvent.title.trim(),
        description: "",
        category: newEvent.category,
        location: newEvent.place.trim(),
        date: eventDate.toISOString(),
        time: eventDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        imageUrl: "",
        price: 0,
        organizer: "LocalVibe Community",
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to create event");
    }

    const savedEvent = result.data;
    const category = String(savedEvent.category || "SOCIAL").toUpperCase();
    const categoryVisual =
      categoryStyles[category] || categoryStyles.SOCIAL;
    const savedDate = new Date(savedEvent.date);

    const formattedDate = Number.isNaN(savedDate.getTime())
      ? "Date to be announced"
      : `${savedDate
          .toLocaleString("en-US", { month: "short" })
          .toUpperCase()} ${savedDate.getDate()}${
          savedEvent.time ? ` · ${savedEvent.time}` : ""
        }`;

    const createdEvent = {
      ...savedEvent,
      date: formattedDate,
      place: savedEvent.location || newEvent.place,
      distance: "Location not verified",
      attendees: 0,
      seatsLeft: 50,
      category,
      ...categoryVisual,
    };

    setEvents((previous) => [...previous, createdEvent]);
    setNewEvent({
      title: "",
      date: "",
      place: "",
      category: "MUSIC",
    });
    setShowCreateForm(false);
    setSelectedCategory("All");
    setSearchTerm("");

    alert("Event successfully saved to MongoDB!");
  } catch (error) {
    console.error("Error creating event:", error);
    alert("Event save nahi hua. Backend aur error message check karo.");
  }
}}

            >
              <input
                required
                maxLength={80}
                placeholder="Event name"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <input
                required
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
              <input
                required
                maxLength={120}
                placeholder="Event location"
                value={newEvent.place}
                onChange={(e) => setNewEvent({ ...newEvent, place: e.target.value })}
              />
              <select
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              >
                <option value="MUSIC">Music</option>
                <option value="FOOD">Food</option>
                <option value="ART">Art</option>
                <option value="SPORTS">Sports</option>
                <option value="SOCIAL">Social</option>
              </select>
              <button type="submit">Publish Event</button>
            </form>
          )}

          <div className="events-grid">
            {filteredEvents.map((event) => (
              <article className="event-card" key={event.title}>
                <div className={`event-image ${event.style}`}>
                  <span>{event.emoji}</span>
                  <span className="event-category">{event.category}</span>
                </div>

                <div className="event-info">
                  <p className="event-date">{event.date}</p>
                  <h3>{event.title}</h3>
                  <p>📍 {event.place}</p>
                  <p className="event-distance">🗺️ {event.distance}</p>

                  <div className="event-stats">
                    <span>👥 {event.attendees} attending</span>
                    <span>🎟️ {event.seatsLeft} seats left</span>
                  </div>

                  <div className="event-actions">
                    <button
                      className={`going-btn ${
                        goingEvents.includes(event.title) ? 'selected' : ''
                      }`}
                      onClick={() => toggleGoing(event)}
                    >
                      {goingEvents.includes(event.title) ? '✓ Going' : '+ Going'}
                    </button>

                    <button
                      className={`interested-btn ${
                        interestedEvents.includes(event.title) ? 'selected' : ''
                      }`}
                      onClick={() => toggleInterested(event.title)}
                    >
                      {interestedEvents.includes(event.title)
                        ? '♥ Interested'
                        : '♡ Interested'}
                    </button>

                    <button
                      className="view-btn"
                      onClick={() => setSelectedEvent(event)}
                    >
                      View Event ↗
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <p className="event-note">
              No events found. Try searching Music, Food, or Art.
            </p>
          )}
        </section>

        <section className="about-section" id="about">
          <p className="tagline">ABOUT LOCALVIBE</p>
          <h2>Find your people. Feel your city.</h2>
          <p>
            LocalVibe helps you discover community events, explore new
            interests, and find things to do around your neighbourhood.
          </p>
          <a className="about-link" href="#events">
            Explore upcoming events <span aria-hidden="true">→</span>
          </a>
        </section>

        {selectedEvent && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedEvent(null)}
          >
            <div
              className="event-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
              >
                ✕
              </button>

              <div className={`event-image ${selectedEvent.style}`}>
                <span>{selectedEvent.emoji}</span>
                <span className="event-category">{selectedEvent.category}</span>
              </div>

              <div className="modal-content">
                <p className="event-date">UPCOMING LOCAL EVENT</p>
                <h2>{selectedEvent.title}</h2>

                <div className="modal-detail-row">
                  <span>📅</span>
                  <div>
                    <strong>Date &amp; Time</strong>
                    <p>{selectedEvent.date}</p>
                  </div>
                </div>

                <div className="modal-detail-row">
                  <span>📍</span>
                  <div>
                    <strong>Location</strong>
                    <p>{selectedEvent.place}</p>
                    <p>{selectedEvent.distance}</p>
                  </div>
                </div>

                <div className="modal-detail-row">
                  <span>👥</span>
                  <div>
                    <strong>Community</strong>
                    <p>{selectedEvent.attendees} people attending</p>
                    <p>{selectedEvent.seatsLeft} seats left</p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className={`going-btn ${
                      goingEvents.includes(selectedEvent.title) ? 'selected' : ''
                    }`}
                    onClick={() => toggleGoing(selectedEvent)}
                  >
                    {goingEvents.includes(selectedEvent.title)
                      ? '✓ You’re Going'
                      : '+ I’m Going'}
                  </button>

                  <button
                    className={`interested-btn ${
                      interestedEvents.includes(selectedEvent.title) ? 'selected' : ''
                    }`}
                    onClick={() => toggleInterested(selectedEvent.title)}
                  >
                    {interestedEvents.includes(selectedEvent.title)
                      ? '♥ Interested'
                      : '♡ Interested'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="logo" href="#home">
              Local<span>Vibe.</span>
            </a>
            <p>Your city is full of stories. Find the next one.</p>
          </div>

          <div className="footer-links">
            <strong>Discover</strong>
            <a href="#events">Upcoming Events</a>
            <a href="#events" onClick={() => setSelectedCategory('MUSIC')}>Music</a>
            <a href="#events" onClick={() => setSelectedCategory('FOOD')}>Food</a>
          </div>

          <div className="footer-links">
            <strong>LocalVibe</strong>
            <a href="#about">About Us</a>
            <a href="#home">Back to Top ↑</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} LocalVibe. All rights reserved.</p>
          <p>Made for your local community ✨</p>
        </div>
      </footer>
    </div>
  )
}

export default App
