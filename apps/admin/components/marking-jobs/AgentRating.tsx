// apps/admin/src/components/marking-jobs/AgentRating.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Award } from 'lucide-react';

interface RatingBreakdown {
  overall: number;
  communication: number;
  professionalism: number;
  accuracy: number;
  timeliness: number;
  totalRatings: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewedBy: string;
  propertyAddress: string;
  createdAt: string;
}

interface AgentRatingProps {
  jobId: string;
  agentId: string;
  agentName: string;
  currentRating?: RatingBreakdown;
  reviews?: Review[];
  canRate?: boolean;
  onSubmitRating?: (data: {
    rating: number;
    communication: number;
    professionalism: number;
    accuracy: number;
    timeliness: number;
    comment: string;
  }) => void;
}

export default function AgentRating({
  jobId,
  agentId,
  agentName,
  currentRating,
  reviews = [],
  canRate = false,
  onSubmitRating,
}: AgentRatingProps) {
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmitRating) {
        await onSubmitRating({
          rating,
          communication,
          professionalism,
          accuracy,
          timeliness,
          comment,
        });
      }
      setShowRatingForm(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setCommunication(0);
    setProfessionalism(0);
    setAccuracy(0);
    setTimeliness(0);
    setComment('');
  };

  const StarRating = ({
    value,
    onChange,
    readonly = false,
    label,
  }: {
    value: number;
    onChange?: (value: number) => void;
    readonly?: boolean;
    label?: string;
  }) => (
    <div className="space-y-1">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange && onChange(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-700">
            {value.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current Rating Overview */}
      {currentRating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agent Rating</CardTitle>
              {canRate && !showRatingForm && (
                <Button onClick={() => setShowRatingForm(true)} size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Rate Agent
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {currentRating.overall.toFixed(1)}
                  </span>
                  <Star className="h-8 w-8 fill-yellow-500 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-500">
                  Based on {currentRating.totalRatings} rating{currentRating.totalRatings !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Communication</span>
                    <span className="text-sm text-gray-600">
                      {currentRating.communication.toFixed(1)}/5.0
                    </span>
                  </div>
                  <Progress value={(currentRating.communication / 5) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Professionalism</span>
                    <span className="text-sm text-gray-600">
                      {currentRating.professionalism.toFixed(1)}/5.0
                    </span>
                  </div>
                  <Progress value={(currentRating.professionalism / 5) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Accuracy</span>
                    <span className="text-sm text-gray-600">
                      {currentRating.accuracy.toFixed(1)}/5.0
                    </span>
                  </div>
                  <Progress value={(currentRating.accuracy / 5) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Timeliness</span>
                    <span className="text-sm text-gray-600">
                      {currentRating.timeliness.toFixed(1)}/5.0
                    </span>
                  </div>
                  <Progress value={(currentRating.timeliness / 5) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Form */}
      {showRatingForm && (
        <Card className="border-blue-500">
          <CardHeader>
            <CardTitle>Rate {agentName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <StarRating
                label="Overall Rating *"
                value={rating}
                onChange={setRating}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StarRating
                  label="Communication"
                  value={communication}
                  onChange={setCommunication}
                />
                <StarRating
                  label="Professionalism"
                  value={professionalism}
                  onChange={setProfessionalism}
                />
                <StarRating
                  label="Accuracy"
                  value={accuracy}
                  onChange={setAccuracy}
                />
                <StarRating
                  label="Timeliness"
                  value={timeliness}
                  onChange={setTimeliness}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Comments (Optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this agent..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRatingForm(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{review.propertyAddress}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-gray-700">{review.comment}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Reviewed by {review.reviewedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}