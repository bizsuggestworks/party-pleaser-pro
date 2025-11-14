import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  label,
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    // Get API key from environment or use a default
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    setApiKey(key);

    if (!key) {
      console.warn("Google Maps API key not found. Add VITE_GOOGLE_MAPS_API_KEY to your .env file");
      return;
    }

    // Check if script is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      initializeAutocomplete();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          initializeAutocomplete();
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
      initializeAutocomplete();
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup autocomplete on unmount
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
      }
    };
  }, [apiKey]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: ["us", "in", "ca", "gb", "au"] }, // Add more countries as needed
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }
    });

    autocompleteRef.current = autocomplete;
  };

  // Re-initialize when input ref is ready
  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  }, [isLoaded]);

  return (
    <div>
      {label && <Label>{label} {required && <span className="text-red-500">*</span>}</Label>}
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="text"
        autoComplete="off"
      />
      {!apiKey && (
        <p className="text-xs text-muted-foreground mt-1">
          Add VITE_GOOGLE_MAPS_API_KEY to enable address autocomplete
        </p>
      )}
    </div>
  );
}

