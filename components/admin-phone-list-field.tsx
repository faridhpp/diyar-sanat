"use client";

import { useState } from "react";

export function AdminPhoneListField({ name, values, label }: { name: string; values: string[]; label: string }) {
  const [phones, setPhones] = useState(values.length ? values : [""]);
  return (
    <fieldset className="admin-phone-list">
      <legend>{label}</legend>
      <div>
        {phones.map((phone, index) => (
          <div className="admin-phone-row" key={`${name}-${index}`}>
            <input
              name={name}
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={phone}
              onChange={(event) => setPhones((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
              placeholder="+98 41 0000 0000"
              aria-label={`${label} ${index + 1}`}
            />
            <button type="button" onClick={() => setPhones((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : [""])}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setPhones((current) => current.length < 10 ? [...current, ""] : current)}>
        + Add phone number
      </button>
    </fieldset>
  );
}
