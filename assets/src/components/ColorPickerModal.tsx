import React, { useState } from 'react'

interface FormData {
  name: string
  color: string
}

interface ValidationErrors {
  name?: string
}

const ColorPickerModal = ({
  isOpen,
  onSubmit,
}: {
  isOpen: boolean
  onSubmit: (data: FormData) => void
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    color: '#000000',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Name is required'
    }
    if (name.length < 3) {
      return 'Name must be at least 3 characters'
    }
    if (name.length > 50) {
      return 'Name must be less than 50 characters'
    }
    if (!/^[a-zA-Z0-9\s-]+$/.test(name)) {
      return 'Name can only contain letters, numbers, spaces, and hyphens'
    }
    return undefined
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setFormData(prev => ({ ...prev, name: newName }))

    // Only show errors if the field has been touched
    if (touched.name) {
      setErrors(prev => ({
        ...prev,
        name: validateName(newName),
      }))
    }
  }

  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }))
    setErrors(prev => ({
      ...prev,
      name: validateName(formData.name),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields before submit
    const nameError = validateName(formData.name)
    if (nameError) {
      setErrors({ name: nameError })
      setTouched({ name: true })
      return
    }

    onSubmit(formData)
    setFormData({ name: '', color: '#000000' })
    setErrors({})
    setTouched({})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Choose your color</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter name"
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use letters, numbers, spaces, and hyphens (3-50 characters)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-4 items-center">
              <input
                type="color"
                value={formData.color}
                onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="h-10 w-20"
              />
              <span className="text-sm text-gray-600">{formData.color.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-md
                ${errors.name ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={!!errors.name}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ColorPickerModal
