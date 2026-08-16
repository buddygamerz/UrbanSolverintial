'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Camera, Send, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const reportSchema = z.object({
  category: z.enum(['pothole', 'waterlogging', 'congestion', 'footpath', 'drainage', 'traffic_signal', 'construction', 'road_damage', 'accessibility', 'garbage', 'other']),
  severity: z.enum(['low', 'moderate', 'high', 'critical']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  impact_description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
});

type ReportForm = z.infer<typeof reportSchema>;

const CATEGORIES = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'waterlogging', label: 'Waterlogging', icon: '💧' },
  { value: 'congestion', label: 'Congestion', icon: '🚗' },
  { value: 'footpath', label: 'Footpath', icon: '🚶' },
  { value: 'drainage', label: 'Drainage', icon: '🕳️' },
  { value: 'traffic_signal', label: 'Traffic Signal', icon: '🚦' },
  { value: 'construction', label: 'Construction', icon: '🚧' },
  { value: 'road_damage', label: 'Road Damage', icon: '🛣️' },
  { value: 'accessibility', label: 'Accessibility', icon: '♿' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️' },
  { value: 'other', label: 'Other', icon: '❓' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-500', description: 'Minor inconvenience' },
  { value: 'moderate', label: 'Moderate', color: 'bg-yellow-500', description: 'Affects daily routine' },
  { value: 'high', label: 'High', color: 'bg-orange-500', description: 'Safety concern' },
  { value: 'critical', label: 'Critical', color: 'bg-red-700', description: 'Immediate danger' },
];

export default function ReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; issueId?: string; error?: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: 'pothole',
      severity: 'moderate',
      description: '',
      impact_description: '',
    },
  });

  const watchedCategory = watch('category');
  const watchedSeverity = watch('severity');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setValue('latitude', position.coords.latitude);
        setValue('longitude', position.coords.longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location. Please enable location access.');
      }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ReportForm) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          photos: photo ? [photo] : [],
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSubmitResult({ success: true, issueId: result.id });
      } else {
        setSubmitResult({ success: false, error: result.detail || 'Failed to submit report' });
      }
    } catch (error) {
      setSubmitResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">What&apos;s wrong?</h3>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setValue('category', cat.value as any)}
            className={`p-4 rounded-lg border-2 transition-all text-center ${
              watchedCategory === cat.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            <span className="text-3xl block mb-2">{cat.icon}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>
      {errors.category && (
        <p className="text-red-500 text-sm">{errors.category.message}</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Where?</h3>
      <div className="space-y-4">
        <button
          type="button"
          onClick={getCurrentLocation}
          className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-3 hover:border-primary-300 transition-colors"
        >
          <MapPin className="h-6 w-6 text-primary-600" />
          <div>
            <p className="font-medium">Use Current Location</p>
            <p className="text-sm text-gray-500">Auto-detect via GPS</p>
          </div>
        </button>
        
        {location && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">Location Captured</p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>
      {errors.latitude && <p className="text-red-500 text-sm">{errors.latitude.message}</p>}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Show us</h3>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          id="photo-upload"
        />
        {photo ? (
          <div className="relative max-w-md mx-auto">
            <img src={photo} alt="Uploaded" className="max-h-64 rounded-lg mx-auto" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">Click to upload a photo</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
          </label>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">How does it affect people?</h3>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Describe the problem
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800"
          placeholder="e.g., Road becomes heavily flooded after moderate rainfall..."
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="impact" className="block text-sm font-medium mb-2">
          Impact on people (optional)
        </label>
        <textarea
          {...register('impact_description')}
          id="impact"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800"
          placeholder="e.g., Motorcycles cannot pass safely and pedestrians are forced onto the road..."
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4 text-center">
      {submitResult?.success ? (
        <div className="p-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">Report Submitted!</h3>
          <p className="text-green-700 dark:text-green-300 mb-4">
            Your report has been added to the system.
          </p>
          {submitResult.issueId && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Issue ID: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{submitResult.issueId}</code>
            </p>
          )}
          <button
            onClick={() => {
              setSubmitResult(null);
              setStep(1);
              setPhoto(null);
              setLocation(null);
            }}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Submit Another Report
          </button>
        </div>
      ) : submitResult?.error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Submission Failed</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{submitResult.error}</p>
          <button
            onClick={() => setSubmitResult(null)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Review your report and submit. You&apos;ll receive an issue ID for tracking.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Report
                <Send className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const steps = [
    { label: 'Category', render: renderStep1 },
    { label: 'Location', render: renderStep2 },
    { label: 'Photo', render: renderStep3 },
    { label: 'Impact', render: renderStep4 },
    { label: 'Submit', render: renderStep5 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600">
            <ArrowLeft className="h-5 w-5" />
            Back to UrbanSolver
          </Link>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <React.Fragment key={stepItem.label}>
                <div className="flex flex-col items-center">
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index + 1 < step
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : index + 1 === step
                      ? 'bg-white border-primary-600 text-primary-600'
                      : 'bg-white border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}>
                    {index + 1 < step ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium mt-1 ${index + 1 <= step ? 'text-primary-600' : 'text-gray-400'}`}>
                    {stepItem.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${index + 1 < step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report a Civic Issue</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Step {step} of {steps.length}: {steps[step - 1].label}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {steps[step - 1].render()}
            
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Back
              </button>
              {step < steps.length && (
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  Next
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}