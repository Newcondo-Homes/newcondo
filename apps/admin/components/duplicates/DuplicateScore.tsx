"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  details: string;
}

interface DuplicateScoreProps {
  overallScore: number;
  breakdown: ScoreBreakdown[];
}

export default function DuplicateScore({ overallScore, breakdown }: DuplicateScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-red-500";
    if (score >= 75) return "text-orange-500";
    if (score >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-red-500";
    if (score >= 75) return "bg-orange-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (score >= 75) return <AlertCircle className="h-5 w-5 text-orange-500" />;
    if (score >= 50) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Very High Duplicate Probability";
    if (score >= 75) return "High Duplicate Probability";
    if (score >= 50) return "Medium Duplicate Probability";
    return "Low Duplicate Probability";
  };

  const calculateWeightedContribution = (score: number, weight: number) => {
    return ((score * weight) / 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getScoreIcon(overallScore)}
              <span>Duplicate Match Score</span>
            </div>
            <Badge className={getScoreBgColor(overallScore)}>
              {overallScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-semibold ${getScoreColor(overallScore)}`}>
                {getScoreLabel(overallScore)}
              </span>
            </div>
            <Progress value={overallScore} className="h-3" />
          </div>
          <p className="text-sm text-muted-foreground">
            This score is calculated based on multiple factors including location proximity,
            property details, and ownership information. Scores above 90% strongly suggest
            a duplicate listing.
          </p>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {breakdown.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.category}</span>
                  <Badge variant="outline" className="text-xs">
                    Weight: {item.weight}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (+{calculateWeightedContribution(item.score, item.weight)} points)
                  </span>
                </div>
              </div>
              <Progress value={item.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{item.details}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card
        className={
          overallScore >= 90
            ? "border-red-500"
            : overallScore >= 75
            ? "border-orange-500"
            : ""
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {overallScore >= 90 ? (
              <XCircle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
            ) : overallScore >= 75 ? (
              <AlertCircle className="h-6 w-6 text-orange-500 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <h4
                className={`font-semibold ${
                  overallScore >= 90
                    ? "text-red-500"
                    : overallScore >= 75
                    ? "text-orange-500"
                    : "text-green-500"
                }`}
              >
                {overallScore >= 90
                  ? "Immediate Action Required"
                  : overallScore >= 75
                  ? "Review Recommended"
                  : "Low Priority Review"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {overallScore >= 90
                  ? "This is very likely a duplicate listing. Consider removing one of the properties immediately to maintain platform integrity."
                  : overallScore >= 75
                  ? "This appears to be a duplicate listing. Review the properties carefully and take appropriate action."
                  : "While some similarities exist, these properties may not be duplicates. Further investigation may still be warranted if other red flags are present."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h5 className="font-semibold">GPS Proximity (40% weight)</h5>
              <p className="text-muted-foreground">
                Properties within 50 meters: 100% | 50-100m: 80% | 100-200m: 50% | &gt;200m: 0%
              </p>
            </div>
            <div>
              <h5 className="font-semibold">Property Details Match (30% weight)</h5>
              <p className="text-muted-foreground">
                Matching bedrooms, bathrooms, area, and property type
              </p>
            </div>
            <div>
              <h5 className="font-semibold">Address Similarity (20% weight)</h5>
              <p className="text-muted-foreground">
                Fuzzy matching of address strings and location data
              </p>
            </div>
            <div>
              <h5 className="font-semibold">Image Similarity (10% weight)</h5>
              <p className="text-muted-foreground">
                Perceptual hash comparison of property images
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}