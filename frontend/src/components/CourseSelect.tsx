import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { fetchDataAuthenticated } from '@/utils/http';

interface CourseOption {
  readonly value: string;
  readonly label: string;
  readonly isNew?: boolean;
  readonly originalName?: string;
}

interface CourseSelectProps {
  value: CourseOption | null;
  onChange: (newValue: CourseOption | null) => void;
  error?: boolean;
}

export function CourseSelect({ value, onChange, error }: CourseSelectProps) {
  const [options, setOptions] = useState<CourseOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const response = await fetchDataAuthenticated(`${process.env.NEXT_PUBLIC_API_URL}/Courses/catalog`, {
          method: "GET"
        });

        if (response && response.data) {
          const formattedOptions = response.data.map((course: any) => ({
            value: course.code, 
            originalName: course.name,
            label: `${course.code} - ${course.name}`, 
          }));
          setOptions(formattedOptions);
        }
      } catch (err) {
        console.error("Gagal mengambil katalog:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const handleChange = (newValue: any, actionMeta: any) => {
    if (actionMeta.action === 'create-option') {
      onChange({ 
        isNew: true, 
        value: "",
        originalName: newValue.value, 
        label: newValue.label 
      });
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="w-full">
      <CreatableSelect
        isClearable
        isLoading={isLoading}
        options={options}
        value={value}
        onChange={handleChange}
        placeholder="Ketik nama MK lama, atau ketik nama MK baru..."
        formatCreateLabel={(inputValue) => `Buat MK Baru: "${inputValue}"`}
        className="text-sm text-black"
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            borderColor: error ? '#ef4444' : state.isFocused ? '#263C92' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 1px #263C92' : 'none',
            borderRadius: '0.375rem',
            padding: '2px',
          }),
        }}
      />
    </div>
  );
}