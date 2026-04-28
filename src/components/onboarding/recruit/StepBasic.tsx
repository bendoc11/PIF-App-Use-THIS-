import { useState } from "react";
import StepShell, { PrimaryCTA, FieldLabel, TextInput } from "./StepShell";
import { ArrowRight } from "lucide-react";

export interface BasicData {
  firstName: string;
  lastName: string;
  gradYear: string;
  dob: string;
  city: string;
  state: string;
}

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const YEARS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i);

export default function StepBasic({ initial, onNext }: { initial: Partial<BasicData>; onNext: (d: BasicData) => void }) {
  const [data, setData] = useState<BasicData>({
    firstName: initial.firstName || "",
    lastName: initial.lastName || "",
    gradYear: initial.gradYear || "",
    dob: initial.dob || "",
    city: initial.city || "",
    state: initial.state || "",
  });

  const can =
    data.firstName.trim() && data.lastName.trim() && data.gradYear && data.dob && data.city.trim() && data.state;

  return (
    <StepShell
      eyebrow="STEP 1 OF 8 · BASICS"
      title="Let's get you on the map."
      subtitle="The basics coaches need to know who you are."
      footer={
        <PrimaryCTA onClick={() => onNext(data)} disabled={!can}>
          NEXT <ArrowRight className="h-4 w-4" />
        </PrimaryCTA>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>FIRST NAME</FieldLabel>
          <TextInput
            value={data.firstName}
            onChange={(e) => setData({ ...data, firstName: e.target.value })}
            placeholder="First"
            maxLength={50}
          />
        </div>
        <div>
          <FieldLabel>LAST NAME</FieldLabel>
          <TextInput
            value={data.lastName}
            onChange={(e) => setData({ ...data, lastName: e.target.value })}
            placeholder="Last"
            maxLength={50}
          />
        </div>
      </div>

      <div>
        <FieldLabel>GRADUATION YEAR</FieldLabel>
        <div className="grid grid-cols-4 gap-2">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setData({ ...data, gradYear: String(y) })}
              className={`py-3 rounded-xl text-sm font-heading transition-all border ${
                data.gradYear === String(y)
                  ? "bg-primary text-primary-foreground border-primary glow-red"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>DATE OF BIRTH</FieldLabel>
        <TextInput
          type="date"
          value={data.dob}
          onChange={(e) => setData({ ...data, dob: e.target.value })}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <FieldLabel>HOMETOWN (CITY)</FieldLabel>
          <TextInput
            value={data.city}
            onChange={(e) => setData({ ...data, city: e.target.value })}
            placeholder="City"
            maxLength={80}
          />
        </div>
        <div>
          <FieldLabel>STATE</FieldLabel>
          <select
            value={data.state}
            onChange={(e) => setData({ ...data, state: e.target.value })}
            className="w-full h-13 px-3 rounded-xl bg-card border border-border text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">—</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </StepShell>
  );
}
