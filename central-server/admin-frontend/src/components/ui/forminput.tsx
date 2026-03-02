"use client"

import { Controller, useFormContext } from "react-hook-form"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

import { InputGroupProps, RHFInputFieldProps, SelectProps } from "@/types"

//field input group
export function InputGroup({
  name,
  label,
  description,
  type = "text",
  placeholder,
  leftElement,
  rightElement,
}: InputGroupProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]?.message as string | undefined

  return (
    <Field className="flex flex-col gap-2 w-full">
      {label && <FieldLabel className="text-xs text-gray-400" htmlFor={name}>{label}</FieldLabel>}

      <div className="relative flex items-center">
        {leftElement && (
          <span className="absolute left-3 text-muted-foreground">
            {leftElement}
          </span>
        )}

        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          className={`${leftElement ? "pl-10" : ""} ${
            rightElement ? "pr-10" : ""
          } ring-[1.5px]! ring-gray-300! p-2! border-none! rounded-md! text-sm w-full! outline-none! focus:ring-blue-500!`}
          {...register(name)}
        />

        {rightElement && (
          <span className="absolute right-3">
            {rightElement}
          </span>
        )}
      </div>

      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </Field>
  )
}

//field input
export function RHFInputField({
  name,
  label,
  description,
  type = "text",
  placeholder,
}: RHFInputFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]?.message as string | undefined

  return (
    <Field className="flex flex-col gap-2 w-full">
      {label && <FieldLabel className="text-xs text-gray-400" htmlFor={name}>{label}</FieldLabel>}

      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className="ring-[1.5px]! ring-gray-300! p-2! border-none! rounded-md! text-sm w-full! outline-none! focus:ring-blue-500!"
      />

      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </Field>
  )
}
//field select
export function FieldSelect({
  name,
  label,
  description,
  placeholder,
  options,
}: SelectProps) {
  const { control, formState: { errors } } = useFormContext()

  const error = errors[name]?.message as string | undefined

  return (
    <Field>
      {label && <FieldLabel>{label}</FieldLabel>}

      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </Field>
  )
}


