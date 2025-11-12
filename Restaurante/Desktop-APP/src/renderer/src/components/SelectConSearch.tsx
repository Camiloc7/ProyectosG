import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { COLOR_ERROR, COLOR_INPUT_BG, ORANGE } from '../../src/styles/colors'

type SimpleSelectOption =
  | string
  | number
  | { id: string; nombre: string }
  | { id: number; nombre: string }
  | { label: string; value: string }

interface SelectConSearchProps {
  options: SimpleSelectOption[]
  label: string
  placeholder?: string
  value: string | number
  onChange: (value: string) => void
  error?: boolean
  errorMessage?: string
  width?: string | number
  height?: number | string
}

const SelectConSearch: React.FC<SelectConSearchProps> = ({
  options,
  placeholder = 'Buscar...',
  value,
  label,
  onChange,
  error = false,
  width = '100%',
  height = 40,
  errorMessage = 'El campo es obligatorio'
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchBarIsOpen, setSearchBarIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const optionsListRef = useRef<HTMLUListElement>(null)

  const COLOR_TEXTO = '#2A2A2A'

  const renderOptionLabel = (option: SimpleSelectOption) =>
    typeof option === 'string'
      ? option
      : typeof option === 'number'
        ? option.toString()
        : 'nombre' in option
          ? option.nombre
          : option.label

  const filteredOptions = options
    .map((option) => ({
      option,
      match: renderOptionLabel(option)
        .toLowerCase()
        .includes((value?.toString() || searchTerm).toLowerCase())
    }))
    .sort((a, b) => (b.match ? 1 : 0) - (a.match ? 1 : 0))
    .map((item) => item.option)

  const handleSelectOption = (option: SimpleSelectOption) => {
    const selectedValue =
      typeof option === 'string'
        ? option
        : typeof option === 'number'
          ? option.toString()
          : 'id' in option
            ? option.id
            : option.value
    onChange(String(selectedValue))
    setSearchBarIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(null)
  }

  const selectedOption = options.find((option) => {
    const val = value.toString()
    if (typeof option === 'string' || typeof option === 'number') {
      return option.toString() === val
    } else if ('id' in option) {
      return option.id.toString() === val
    }
    return option.value === val
  })

  const displayValue = selectedOption ? renderOptionLabel(selectedOption) : searchTerm

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    onChange('') // limpiamos valor para buscar
    setSearchBarIsOpen(true)
    setHighlightedIndex(null)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setSearchBarIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchBarIsOpen) return
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault()
    }
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) =>
        prev === null || prev === filteredOptions.length - 1 ? 0 : prev + 1
      )
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) =>
        prev === null || prev === 0 ? filteredOptions.length - 1 : prev - 1
      )
    } else if (e.key === 'Enter' && highlightedIndex !== null) {
      handleSelectOption(filteredOptions[highlightedIndex])
    }
  }

  const handleInputFocus = () => {
    if (!searchBarIsOpen) setSearchBarIsOpen(true)
    if (searchBarIsOpen) {
      const currentIndex = options.findIndex((option) => {
        const val = value.toString()
        if (typeof option === 'string' || typeof option === 'number') {
          return option.toString() === val
        } else if ('id' in option) {
          return option.id.toString() === val
        }
        return option.value === val
      })
      setHighlightedIndex(currentIndex === -1 ? 0 : currentIndex)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (highlightedIndex !== null && optionsListRef.current) {
      const optionEl = optionsListRef.current.children[highlightedIndex] as HTMLElement
      optionEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  return (
    <div style={{ width: width, marginBottom: 15 }}>
      <label
        style={{
          display: 'block',
          fontSize: 16,
          fontWeight: 500,
          fontFamily: 'Lato, sans-serif',
          color: '#555',
          marginBottom: 8
        }}
      >
        {label}
        <span
          style={{
            color: '#f56565',
            marginLeft: 4,
            visibility: error ? 'visible' : 'hidden'
          }}
        >
          *
        </span>
      </label>
      <div ref={ref} style={{ position: 'relative', marginTop: 12 }}>
        <input
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={() => setSearchBarIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            height,
            padding: '0 16px',
            border: `1px solid ${error ? COLOR_ERROR : ORANGE}`,
            borderRadius: 25,
            fontSize: 14,
            color: COLOR_TEXTO,
            width: '100%',
            backgroundColor: COLOR_INPUT_BG,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            cursor: 'text',
            boxSizing: 'border-box',
            fontFamily: 'Lato, sans-serif'
          }}
        />
        <span
          onClick={() => setSearchBarIsOpen(true)}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            cursor: 'pointer'
          }}
        >
          <ChevronDown size={20} />
        </span>

        {searchBarIsOpen && (
          <div
            style={{
              position: 'absolute',
              zIndex: 10,
              minWidth: 160,
              width: '100%',
              background: '#fff',
              border: `1px solid ${ORANGE}`,
              borderRadius: 16,
              maxHeight: 200,
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginTop: 4
            }}
          >
            {filteredOptions.length > 0 ? (
              <ul ref={optionsListRef} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {filteredOptions.map((option, idx) => {
                  const optionLabel = renderOptionLabel(option)
                  const startIndex = optionLabel
                    .toLowerCase()
                    .indexOf((value?.toString() || searchTerm).toLowerCase())
                  const endIndex = startIndex + (value?.toString() || searchTerm).length

                  return (
                    <li
                      key={idx}
                      onClick={() => handleSelectOption(option)}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: COLOR_TEXTO,
                        background:
                          highlightedIndex === idx
                            ? '#fffaef'
                            : selectedOption === option
                              ? '#f6f6f6'
                              : 'transparent',
                        fontFamily: 'Lato, sans-serif'
                      }}
                    >
                      {startIndex !== -1 && searchTerm ? (
                        <span>
                          {optionLabel.slice(0, startIndex)}
                          <strong style={{ color: ORANGE }}>
                            {optionLabel.slice(startIndex, endIndex)}
                          </strong>
                          {optionLabel.slice(endIndex)}
                        </span>
                      ) : (
                        optionLabel
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div style={{ padding: 10, fontSize: 14, color: '#777' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <span style={{ color: '#f56565', fontSize: 12, marginTop: 4, display: 'block' }}>
          {errorMessage}
        </span>
      )}
    </div>
  )
}

export default SelectConSearch
