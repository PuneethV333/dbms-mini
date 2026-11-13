"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeoStatus = "idle" | "unsupported" | "prompting" | "granted" | "denied" | "unavailable";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 5_000,
};

function toPosition(position: GeolocationPosition): GeoPosition {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? undefined,
    timestamp: position.timestamp,
  };
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setPosition(toPosition(position));
      setStatus("granted");
      setError(null);
    };

    const onError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setStatus("denied");
        setError("Location permission denied.");
      } else {
        setStatus("unavailable");
        setError("GPS unavailable right now — sharing last known location.");
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, WATCH_OPTIONS);
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, WATCH_OPTIONS);
  }, []);

  const requestPermission = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permission) => {
          if (permission.state === "denied") setStatus("denied");
        })
        .catch(() => {
          // Fall through and let the prompt fire.
        });
    }

    setStatus("prompting");
    startWatching();
  }, [startWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  return { status, position, error, requestPermission, startWatching, stopWatching };
}
