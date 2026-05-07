import { useState } from "react";
import reservationData from "./data/reservationMock.json";

const buildInitialReservations = (data: { reservationDate: string }[]) => {
  return data.reduce<Record<string, number[]>>((acc, reservation) => {
    const [datePart, timePart] = reservation.reservationDate.split(" ");
    const hour = parseInt(timePart.split(":")[0], 10);
    if (!Number.isFinite(hour)) return acc;
    const existing = acc[datePart] ?? [];
    return {
      ...acc,
      [datePart]: Array.from(new Set([...existing, hour])),
    };
  }, {});
};

const initialReservations = buildInitialReservations(reservationData);

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [showHours, setShowHours] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reservations, setReservations] = useState<Record<string, number[]>>(initialReservations);

  const hours = Array.from({ length: 13 }, (_, i) => 8 + i); // 8 to 20

  const pad = (value: number) => String(value).padStart(2, '0');
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };
  const getReservationStatus = (day: Date) => {
    const reservedHours = reservations[getDateKey(day)] ?? [];
    if (reservedHours.length === 0) return 'free';
    if (reservedHours.length >= hours.length) return 'full';
    return 'partial';
  };
  const getBookedHours = (day: Date | null) => {
    if (!day) return [];
    return reservations[getDateKey(day)] ?? [];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return { days, firstDayOfWeek: firstDay.getDay() };
  };

  const { days, firstDayOfWeek } = getDaysInMonth(currentMonth);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowHours(true);
    setShowForm(false);
    setSelectedHour(null);
  };

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || selectedDate === null || selectedHour === null) {
      alert('Please fill in all fields');
      return;
    }
    const dayKey = getDateKey(selectedDate);
    setReservations(prev => {
      const current = prev[dayKey] ?? [];
      if (current.includes(selectedHour)) return prev;
      return {
        ...prev,
        [dayKey]: [...current, selectedHour],
      };
    });
    alert(`Reservation made for ${selectedDate.toDateString()} at ${selectedHour}:00 by ${name} (${email})`);
    setShowHours(false);
    setShowForm(false);
    setSelectedDate(null);
    setSelectedHour(null);
    setName('');
    setEmail('');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Field Reservation</h1>

      <div className="card bg-base-100 shadow-xl p-6 mb-6">
        <div className="calendar">
          <div className="calendar-header flex justify-between items-center mb-4">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              ‹
            </button>
            <div className="text-lg font-semibold">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              ›
            </button>
          </div>
          <div className="calendar-body">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center font-medium text-sm">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`}></div>
              ))}
              {days.map(day => (
                <button
                  key={day.toISOString()}
                  className={`btn btn-ghost btn-sm ${
                    selectedDate && day.toDateString() === selectedDate.toDateString() ? 'btn-active' : ''
                  } ${
                    getReservationStatus(day) === 'full'
                      ? 'text-red-600'
                      : getReservationStatus(day) === 'partial'
                      ? 'text-yellow-600'
                      : ''
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  {day.getDate()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showHours && selectedDate && (
        <div className="relative overflow-hidden min-h-96">
          <div
            className={`absolute inset-0 transition-transform duration-500 ${
              showForm ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="card bg-base-100 shadow-xl p-6 h-full">
              <h2 className="card-title text-xl mb-4">
                Available Hours for {selectedDate.toDateString()}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {hours.map(hour => {
                  const booked = getBookedHours(selectedDate).includes(hour);
                  return (
                    <button
                      key={hour}
                      className={`btn btn-outline btn-sm ${booked ? 'btn-disabled opacity-60' : ''}`}
                      onClick={() => !booked && handleHourClick(hour)}
                      disabled={booked}
                    >
                      {hour}:00 - {hour + 1}:00
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div
            className={`absolute inset-0 transition-transform duration-500 ${
              showForm ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {showForm && selectedHour && (
              <div className="card bg-base-100 shadow-xl p-6 h-full">
                <h2 className="card-title text-xl mb-4">
                  Reserve {selectedDate.toDateString()} at {selectedHour}:00 - {selectedHour + 1}:00
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="input input-bordered"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Your email"
                      className="input input-bordered"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-full">
                    Reserve
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
