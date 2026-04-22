import type { TripPlan } from "../../models/domain";

type TripStatus = "past" | "active" | "upcoming";

function getTripStatus(trip: TripPlan, activeTripId: string | null): TripStatus {
  if (trip.id === activeTripId) {
    return "active";
  }

  const today = new Date().toISOString().slice(0, 10);
  if (trip.endDate < today) {
    return "past";
  }

  return "upcoming";
}

function statusLabel(status: TripStatus): string {
  if (status === "active") {
    return "Actif";
  }

  if (status === "past") {
    return "Passe";
  }

  return "A venir";
}

export function TripsView({
  trips,
  activeTripId,
  onSwitchTrip,
  onCreateTrip,
}: Readonly<{
  trips: TripPlan[];
  activeTripId: string | null;
  onSwitchTrip: (tripId: string) => void;
  onCreateTrip: () => void;
}>) {
  const sortedTrips = [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <section className="trips-view">
      <header className="trips-header">
        <div>
          <h3>Trips</h3>
          <p className="field-hint">Basculer de voyage actif ou en creer un nouveau.</p>
        </div>
        <button className="primary-button" type="button" onClick={onCreateTrip}>
          + Nouveau voyage
        </button>
      </header>

      {sortedTrips.length === 0 && (
        <article className="trip-card trip-empty">
          <h4>Aucun voyage pour le moment</h4>
          <p>Demarrez votre premier tour en ouvrant le wizard de creation.</p>
          <button className="primary-button" type="button" onClick={onCreateTrip}>
            Lancer le wizard
          </button>
        </article>
      )}

      {sortedTrips.map((trip) => {
        const status = getTripStatus(trip, activeTripId);
        const countryCount = trip.countries.length;

        return (
          <article key={trip.id} className={`trip-card ${status}`.trim()}>
            <div className="trip-card-top">
              <h4>{trip.title}</h4>
              <span className={`trip-status ${status}`.trim()}>{statusLabel(status)}</span>
            </div>

            {trip.description && <p>{trip.description}</p>}

            <p className="field-hint">
              {trip.startDate} → {trip.endDate} · {countryCount} pays
            </p>
            <p className="field-hint">Budget global: {trip.totalBudget.toFixed(2)} EUR</p>

            <div className="sheet-actions">
              <button
                className={trip.id === activeTripId ? "ghost-button" : "primary-button"}
                type="button"
                onClick={() => onSwitchTrip(trip.id)}
                disabled={trip.id === activeTripId}
              >
                {trip.id === activeTripId ? "Voyage actif" : "Activer ce voyage"}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
