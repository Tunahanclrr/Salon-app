import React, { useState, useMemo } from 'react';
import Select from 'react-select';

export default function AppointmentForm({ customers, employees, onSubmit, onCancel, onAddCustomer }) {
  const [form, setForm] = useState({
    customerId: '',
    employeeId: '',
    date: '',
    time: '',
    service: '',
    notes: '',
  });
  const [customerSearch, setCustomerSearch] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Backend alan adları employee ve customer
    const payload = {
      ...form,
      employee: form.employeeId,
      customer: form.customerId,
    };
    delete payload.employeeId;
    delete payload.customerId;
    onSubmit(payload);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <div>
        <div className="flex gap-2 mb-1">
          <div className="grow">
            <Select
              options={customers.map(c=>({value:c._id,label:c.name}))}
              placeholder="Müşteri ara / seç..."
              onChange={(opt)=>setForm({...form,customerId:opt?.value||''})}
              value={customers.find(c=>c._id===form.customerId)?{value:form.customerId,label:customers.find(c=>c._id===form.customerId).name}:null}
              isClearable
            />
          </div>
          <button
            type="button"
            className="bg-green-500 text-white px-3 rounded hover:bg-green-600"
            onClick={onAddCustomer}
          >
            + Yeni Müşteri
          </button>
        </div>

        <Select
          options={employees.map(e=>({value:e._id,label:e.name}))}
          placeholder="Çalışan Seç"
          onChange={(opt)=>setForm({...form,employeeId:opt?.value||''})}
          value={employees.find(e=>e._id===form.employeeId)?{value:form.employeeId,label:employees.find(e=>e._id===form.employeeId).name}:null}
          classNamePrefix="react-select"
        />
      </div>

      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="time"
        name="time"
        value={form.time}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="service"
        placeholder="Hizmet"
        value={form.service}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        name="notes"
        placeholder="Not (isteğe bağlı)"
        value={form.notes}
        onChange={handleChange}
        className="w-full border p-2 rounded min-h-[60px] resize-y"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">İptal</button>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Kaydet</button>
      </div>
    </form>
  );
}
