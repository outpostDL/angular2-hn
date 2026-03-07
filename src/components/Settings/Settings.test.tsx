import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Settings from './Settings';
import { SettingsContext, SettingsContextValue } from '../../contexts/SettingsContext';

function renderSettings(overrides: Partial<SettingsContextValue> = {}) {
    const mockSettings: SettingsContextValue = {
        showSettings: true,
        openLinkInNewTab: false,
        theme: 'default',
        titleFontSize: '16',
        listSpacing: '0',
        toggleSettings: vi.fn(),
        toggleOpenLinksInNewTab: vi.fn(),
        setTheme: vi.fn(),
        setFont: vi.fn(),
        setSpacing: vi.fn(),
        ...overrides,
    };

    return {
        mockSettings,
        ...render(
            <SettingsContext.Provider value={mockSettings}>
                <Settings />
            </SettingsContext.Provider>
        ),
    };
}

describe('Settings', () => {
    it('renders all controls (checkbox, 3 radio buttons, 2 number inputs)', () => {
        renderSettings();

        // Checkbox for open links in new tab
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();

        // 3 theme radio buttons
        const radios = screen.getAllByRole('radio');
        expect(radios).toHaveLength(3);

        // 2 number inputs (font size + list spacing)
        const numberInputs = screen.getAllByRole('spinbutton');
        expect(numberInputs).toHaveLength(2);
    });

    it('close button calls toggleSettings', () => {
        const { mockSettings } = renderSettings();

        const closeButton = screen.getByText('\u00D7');
        fireEvent.click(closeButton);

        expect(mockSettings.toggleSettings).toHaveBeenCalledTimes(1);
    });

    it('checking "open in new tab" calls toggleOpenLinksInNewTab', () => {
        const { mockSettings } = renderSettings();

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(mockSettings.toggleOpenLinksInNewTab).toHaveBeenCalledTimes(1);
    });

    it('selecting a theme radio calls setTheme with correct value', () => {
        const { mockSettings } = renderSettings();

        const nightRadio = screen.getByLabelText('Night');
        fireEvent.click(nightRadio);
        expect(mockSettings.setTheme).toHaveBeenCalledWith('night');

        const amoledRadio = screen.getByLabelText('Black (AMOLED)');
        fireEvent.click(amoledRadio);
        expect(mockSettings.setTheme).toHaveBeenCalledWith('amoledblack');
    });

    it('selecting default theme radio calls setTheme with "default"', () => {
        // Start with a non-default theme so clicking "Default" triggers onChange
        const { mockSettings } = renderSettings({ theme: 'night' });

        const defaultRadio = screen.getByLabelText('Default');
        fireEvent.click(defaultRadio);
        expect(mockSettings.setTheme).toHaveBeenCalledWith('default');
    });

    it('changing font size input calls setFont', () => {
        const { mockSettings } = renderSettings();

        const fontInput = screen.getByRole('spinbutton', { name: /font size/i });
        fireEvent.change(fontInput, { target: { value: '20' } });

        expect(mockSettings.setFont).toHaveBeenCalledWith('20');
    });

    it('changing spacing input calls setSpacing', () => {
        const { mockSettings } = renderSettings();

        const spacingInput = screen.getByRole('spinbutton', { name: /list spacing/i });
        fireEvent.change(spacingInput, { target: { value: '5' } });

        expect(mockSettings.setSpacing).toHaveBeenCalledWith('5');
    });

    it('renders heading and structural elements', () => {
        renderSettings();

        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Links')).toBeInTheDocument();
        expect(screen.getByText('Select a theme')).toBeInTheDocument();
        expect(screen.getByText('Change Font')).toBeInTheDocument();
    });

    it('checkbox reflects openLinkInNewTab state from context', () => {
        renderSettings({ openLinkInNewTab: true });

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
    });

    it('theme radio reflects current theme from context', () => {
        renderSettings({ theme: 'night' });

        expect(screen.getByLabelText('Night')).toBeChecked();
        expect(screen.getByLabelText('Default')).not.toBeChecked();
        expect(screen.getByLabelText('Black (AMOLED)')).not.toBeChecked();
    });

    it('number inputs reflect font size and spacing from context', () => {
        renderSettings({ titleFontSize: '24', listSpacing: '10' });

        const fontInput = screen.getByRole('spinbutton', { name: /font size/i });
        expect(fontInput).toHaveValue(24);

        const spacingInput = screen.getByRole('spinbutton', { name: /list spacing/i });
        expect(spacingInput).toHaveValue(10);
    });
});
