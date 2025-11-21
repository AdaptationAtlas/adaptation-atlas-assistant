import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Pill } from './Pill';
import styles from './Combobox.module.css';

export interface ComboboxOption {
    value: string;
    label: string;
}

export interface ComboboxProps {
    label: string;
    placeholder?: string;
    options: ComboboxOption[];
    value?: string[];
    onChange?: (value: string[]) => void;
    defaultValue?: string[];
}

export function Combobox({
    label,
    placeholder,
    options,
    value,
    onChange,
    defaultValue = [],
}: ComboboxProps) {
    const [selectedValues, setSelectedValues] = useState<string[]>(
        value || defaultValue
    );
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = options.filter(
        (option) =>
            !selectedValues.includes(option.value) &&
            option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleSelect = (optionValue: string) => {
        const newValues = [...selectedValues, optionValue];
        setSelectedValues(newValues);
        onChange?.(newValues);
        setInputValue('');
        setIsOpen(false);
    };

    const handleRemove = (optionValue: string) => {
        const newValues = selectedValues.filter((v) => v !== optionValue);
        setSelectedValues(newValues);
        onChange?.(newValues);
    };

    const selectedOptions = options.filter((opt) =>
        selectedValues.includes(opt.value)
    );

    return (
        <div className={styles.container}>
            <label className={styles.label}>{label}</label>
            <div className={styles.pillContainer}>
                {selectedOptions.map((option) => (
                    <Pill
                        key={option.value}
                        onRemove={() => handleRemove(option.value)}
                    >
                        {option.label}
                    </Pill>
                ))}
            </div>
            <div className={styles.inputWrapper}>
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    className={styles.input}
                />
                {isOpen && filteredOptions.length > 0 && (
                    <div className={styles.dropdown}>
                        {filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={styles.option}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
