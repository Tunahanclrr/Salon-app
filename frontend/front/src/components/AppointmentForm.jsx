import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { fetchServices } from "../redux/servicesSlice";

// Basit Modal bileşeni
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded p-6 max-w-md w-full shadow-lg relative">
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default function AppointmentForm({
  employees,
  customers,
  appointments,
  onCancel,
  onSubmit,
  onAddCustomer,
  initialData = null,
}) {
  const dispatch = useDispatch();
  const { items: services, loading } = useSelector((state) => state.services);

  // Form state ve validasyon hataları
  const [form, setForm] = useState({
    employeeId: "",
    customerId: "",
    date: "",
    time: "",
    selectedServices: [],
    notes: "",
  });
  const [errors, setErrors] = useState({});

  // Çakışma ve zorla gönderim durumu
  const [forceSend, setForceSend] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  // Modal yeni müşteri için
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [newCustomerError, setNewCustomerError] = useState("");

  // Arama için debounce kullanılan müşteri arama state'i
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");

  // Toplam süre ve fiyat
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // --- EFFECTS ---

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Debounce müşteri araması için
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [customerSearch]);

  // initialData değişince formu setle
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        employeeId: initialData.employeeId || prev.employeeId,
        date: initialData.date || prev.date,
        time: initialData.time || prev.time,
        selectedServices: initialData.serviceId
          ? [services.find((s) => s._id === initialData.serviceId)]
              .filter(Boolean)
              .map((svc) => ({
                value: svc._id,
                label: `${svc.name} (${svc.duration} dk)`,
                duration: svc.duration,
                price: svc.price,
              }))
          : prev.selectedServices,
      }));
    }
  }, [initialData, services]);

  // Seçili hizmetler değişince toplam süre ve fiyatı güncelle
  useEffect(() => {
    const duration = form.selectedServices.reduce(
      (sum, svc) => sum + (svc.duration || 0),
      0
    );
    const price = form.selectedServices.reduce(
      (sum, svc) => sum + (svc.price || 0),
      0
    );
    setTotalDuration(duration);
    setTotalPrice(price);
  }, [form.selectedServices]);

  // --- OPTIONS ---
  const serviceOptions = services.map((svc) => ({
    value: svc._id,
    label: `${svc.name} (${svc.duration} dk) - ₺${(svc.price ?? 0).toFixed(2)}`,
    duration: svc.duration,
    price: svc.price ?? 0,
  }));

  const employeeOptions = employees.map((emp) => ({
    value: emp._id,
    label: `${emp.name} - ${emp.role}`,
  }));

  const customerOptions = customers.map((cust) => ({
    value: cust._id,
    label: `${cust.name} - ${cust.phone}`,
  }));

  const filteredCustomerOptions = useMemo(() => {
    return customerOptions.filter((c) =>
      c.label.toLowerCase().includes(debouncedCustomerSearch.toLowerCase())
    );
  }, [debouncedCustomerSearch, customerOptions]);

  // --- Saat seçenekleri ve uygunluk kontrolü ---
  const timeOptions = useMemo(() => {
    if (!form.employeeId || !form.date || totalDuration === 0) return [];

    const startHour = 9;
    const endHour = 20;
    const interval = 15;

    const times = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += interval) {
        const time = `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`;
        times.push(time);
      }
    }

    const employeeAppointments = appointments.filter(
      (app) =>
        app.employee?._id === form.employeeId &&
        app.date === form.date &&
        app.status !== "cancelled"
    );

    const isTimeSlotAvailable = (timeSlot) => {
      const [startHourSlot, startMinuteSlot] = timeSlot.split(":").map(Number);
      const slotStart = new Date(0, 0, 0, startHourSlot, startMinuteSlot);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);

      const endOfDay = new Date(0, 0, 0, 20, 0, 0);
      if (slotEnd > endOfDay) return false;

      return !employeeAppointments.some((app) => {
        if (!app.time) return false;

        const [appHour, appMinute] = app.time.split(":").map(Number);
        const appStart = new Date(0, 0, 0, appHour, appMinute);
        const appEnd = new Date(
          appStart.getTime() + (app.duration || 30) * 60000
        );

        return (
          (slotStart >= appStart && slotStart < appEnd) ||
          (slotEnd > appStart && slotEnd <= appEnd) ||
          (slotStart <= appStart && slotEnd >= appEnd)
        );
      });
    };

    const availableSlots = times.map((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const slotStart = new Date(0, 0, 0, hour, minute);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);
      const endTimeStr = `${slotEnd
        .getHours()
        .toString()
        .padStart(2, "0")}:${slotEnd.getMinutes().toString().padStart(2, "0")}`;

      const isAvailable = isTimeSlotAvailable(time);

      return {
        value: time,
        label: isAvailable
          ? `${time} - ${endTimeStr} (${totalDuration} dk)`
          : `${time} - dolu`,
        isDisabled: false,
        endTime: endTimeStr,
      };
    });

    return availableSlots;
  }, [
    form.employeeId,
    form.date,
    form.selectedServices,
    appointments,
    totalDuration,
  ]);

  // --- Zaman çakışması kontrolü ---
  const checkTimeConflict = useCallback(() => {
    if (!form.time) return false;
    const [sh, sm] = form.time.split(":").map(Number);
    const selectedStart = new Date(0, 0, 0, sh, sm);
    const selectedEnd = new Date(
      selectedStart.getTime() + totalDuration * 60000
    );

    return appointments.some((app) => {
      if (
        app.employee?._id !== form.employeeId ||
        app.date !== form.date ||
        app.status === "cancelled"
      )
        return false;
      if (!app.time) return false;

      const [appHour, appMinute] = app.time.split(":").map(Number);
      const appStart = new Date(0, 0, 0, appHour, appMinute);
      const appEnd = new Date(
        appStart.getTime() + (app.duration || 30) * 60000
      );

      return (
        selectedStart < appEnd && selectedEnd > appStart // Çakışma varsa true
      );
    });
  }, [appointments, form.date, form.employeeId, form.time, totalDuration]);

  // --- Form validasyonu ---
  const validateForm = () => {
    const newErrors = {};
    if (!form.customerId) newErrors.customerId = "Müşteri seçimi zorunludur.";
    if (!form.employeeId) newErrors.employeeId = "Çalışan seçimi zorunludur.";
    if (!form.date) newErrors.date = "Tarih zorunludur.";
    if (!form.time) newErrors.time = "Saat seçimi zorunludur.";
    if (form.selectedServices.length === 0)
      newErrors.selectedServices = "En az bir hizmet seçmelisiniz.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Form submit ---
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!forceSend && checkTimeConflict()) {
      setConflictModalOpen(true);
      return;
    }

    const selectedServicesForPayload = form.selectedServices.map((svc) => ({
      _id: svc.value,
      name: svc.label.split(" (")[0],
      duration: svc.duration,
      price: svc.price,
    }));

    const calculatedDuration = selectedServicesForPayload.reduce(
      (total, svc) => total + (svc.duration || 30),
      0
    );

    const payload = {
      customerId: form.customerId,
      employee: form.employeeId,
      date: form.date,
      time: form.time,
      services: selectedServicesForPayload.map((svc) => svc._id),
      duration: calculatedDuration,
      notes: form.notes || undefined,
      force: forceSend,
    };
    console.log("Gönderilen veri:", payload);
    onSubmit(payload);
  };

  // --- Yeni müşteri ekleme işlemleri ---
  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewCustomerSubmit = () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      setNewCustomerError("Lütfen tüm alanları doldurun.");
      return;
    }
    setNewCustomerError("");
    // onAddCustomer fonksiyonunun yeni müşteri objesi ile çağrıldığını varsayıyoruz.
    onAddCustomer(newCustomer);
    setNewCustomer({ name: "", phone: "" });
    setNewCustomerModalOpen(false);
  };

  return (
    <>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Müşteri seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Müşteri
          </label>
          <Select
            options={filteredCustomerOptions}
            onInputChange={(value) => setCustomerSearch(value)}
            onChange={(opt) =>
              setForm({ ...form, customerId: opt?.value || "" })
            }
            placeholder="Müşteri ara / seç..."
            isClearable
            value={
              customerOptions.find((opt) => opt.value === form.customerId) ||
              null
            }
            classNamePrefix="react-select"
          />
          {errors.customerId && (
            <p className="text-red-600 text-sm mt-1">{errors.customerId}</p>
          )}
          <button
            type="button"
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
            onClick={() => setNewCustomerModalOpen(true)}
          >
            + Yeni Müşteri
          </button>
        </div>

        {/* Çalışan seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Çalışan
          </label>
          <Select
            options={employeeOptions}
            onChange={(opt) =>
              setForm({ ...form, employeeId: opt?.value || "" })
            }
            placeholder="Çalışan seçin..."
            isClearable
            value={
              employeeOptions.find((opt) => opt.value === form.employeeId) ||
              null
            }
            classNamePrefix="react-select"
          />
          {errors.employeeId && (
            <p className="text-red-600 text-sm mt-1">{errors.employeeId}</p>
          )}
        </div>

        {/* Tarih ve Saat */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tarih
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value, time: "" }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={new Date().toISOString().split("T")[0]}
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Saat
            </label>
            <Select
              options={timeOptions}
              value={timeOptions.find((opt) => opt.value === form.time) || null}
              onChange={(opt) =>
                setForm((prev) => ({ ...prev, time: opt?.value || "" }))
              }
              placeholder="Saat seçin..."
              isClearable
              isDisabled={
                !form.employeeId ||
                !form.date ||
                form.selectedServices.length === 0
              }
              noOptionsMessage={() => "Uygun zaman aralığı bulunamadı"}
              classNamePrefix="react-select"
              isOptionDisabled={(option) => option.isDisabled}
              styles={{
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isDisabled
                    ? "#f3f4f6"
                    : state.isSelected
                    ? "#3b82f6"
                    : "white",
                  color: state.isDisabled
                    ? "#9ca3af"
                    : state.isSelected
                    ? "white"
                    : "#1f2937",
                  cursor: state.isDisabled ? "not-allowed" : "default",
                  "&:hover": {
                    backgroundColor: state.isDisabled
                      ? "#f3f4f6"
                      : state.isSelected
                      ? "#2563eb"
                      : "#f3f4f6",
                  },
                }),
              }}
            />
            {errors.time && (
              <p className="text-red-600 text-sm mt-1">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Hizmetler */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Hizmetler
            </label>
            <span className="text-sm text-gray-500">
              Toplam süre: {totalDuration} dakika | Toplam fiyat: ₺
              {totalPrice.toFixed(2)}
            </span>
          </div>
          <Select
            isMulti
            options={serviceOptions}
            value={form.selectedServices}
            onChange={(selected) =>
              setForm({ ...form, selectedServices: selected || [] })
            }
            placeholder="Hizmet seçin..."
            classNamePrefix="react-select"
            isLoading={loading}
            closeMenuOnSelect={false}
          />
          {errors.selectedServices && (
            <p className="text-red-600 text-sm mt-1">
              {errors.selectedServices}
            </p>
          )}
        </div>

        {/* Notlar */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notlar
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* İşlem butonları */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Randevu Oluştur
          </button>
        </div>
      </form>

      {/* Çakışma Modalı */}
      <Modal
        open={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
      >
        <h3 className="text-lg font-semibold mb-4">Zaman Çakışması</h3>
        <p>
          Seçtiğiniz tarih ve saat, başka bir randevu ile çakışıyor. Yine de
          devam etmek istiyor musunuz?
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setConflictModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Vazgeç
          </button>
          <button
            onClick={() => {
              setForceSend(true);
              setConflictModalOpen(false);
              // Formu tekrar submit et
              setTimeout(() => {
                document
                  .querySelector("form")
                  .dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  );
              }, 10);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            Zorla Gönder
          </button>
        </div>
      </Modal>

      {/* Yeni Müşteri Modalı */}
      <Modal
        open={newCustomerModalOpen}
        onClose={() => setNewCustomerModalOpen(false)}
      >
        <h3 className="text-lg font-semibold mb-4">Yeni Müşteri Ekle</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ad Soyad
            </label>
            <input
              type="text"
              name="name"
              value={newCustomer.name}
              onChange={handleNewCustomerChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefon
            </label>
            <input
              type="text"
              name="phone"
              value={newCustomer.phone}
              onChange={handleNewCustomerChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {newCustomerError && (
            <p className="text-red-600 text-sm">{newCustomerError}</p>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setNewCustomerModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              İptal
            </button>
            <button
              onClick={handleNewCustomerSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              Kaydet
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
