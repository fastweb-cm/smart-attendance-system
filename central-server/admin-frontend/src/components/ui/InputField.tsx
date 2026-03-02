'use client';

import { useFormContext } from "react-hook-form";
import { InputFieldProps } from "@/types";

const InputField = ({
  label,
  type = "text",
  name,
  required,
  options,
  defaultValue,
  inputProps,
  valueType,
}: InputFieldProps) => {
  const { register, formState: { errors } } = useFormContext(); // access the form global state
  
  const error = errors[name]?.message as string | undefined;

  const registerOptions =
    valueType === "number"
      ? { valueAsNumber: true }
      : undefined

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-xs text-gray-500">
          {label} {required && <span className="text-red-700">*</span>}
        </label>
      )}

      {type === "select" ? (
        <select
          {...register(name, registerOptions)}
          {...(inputProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full outline-none focus:ring-blue-500"
          defaultValue={defaultValue}
        >
          <option value="">Select an option</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register(name)}
            className="w-4 h-4 accent-blue-600"
            {...inputProps}
          />
          <span className="text-sm text-gray-600">{label}</span>
        </div>
      ) : type === "radio" ? (
        <div className="flex flex-row items-center gap-2">
          {options?.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1">
              <input 
                type="radio"
                value={opt.value} 
                {...register(name)} 
                {...inputProps}
                defaultValue={defaultValue} 
              />
              <span className="text-xs text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <input
          type={type}
          {...register(name)}
          {...inputProps}
          defaultValue={defaultValue}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full outline-none focus:ring-blue-500"
        />
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default InputField;
