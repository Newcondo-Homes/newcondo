import React, { useMemo } from 'react';
import { Card } from '@newcondo/ui';
import {
  DollarSign,
  User,
  Building2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface CompensationBreakdownProps {
  markingType?: 'self' | 'known_person' | 'newcondo' | 'agent_network';
  isPropertyOwner?: boolean;
  userRole?: 'OWNER' | 'AGENT' | 'RENTER';
}


interface CompensationDetails {
  totalFee: number;
  userEarning: number;
  newcondoEarning: number;
  description: string;
  breakdown: BreakdownItem[];
}


interface BreakdownItem {
  label: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
}

const MARKING_FEES = {
  OWNER_PAYS: 20000, // Property owners pay
  AGENT_EARNS: 5000, // 25% of 20000
  NEWCONDO_EARNS_FROM_OWNER: 15000, // 75% of 20000
  NEWCONDO_PAYS_AGENT: 5000, // 25% of 20000
  NEWCONDO_MARKING_FEE: 25000, // Cost for Newcondo to mark
};

export const CompensationBreakdown: React.FC<CompensationBreakdownProps> = ({
  markingType = 'agent_network',
  isPropertyOwner = false,
  userRole = 'AGENT',
}) => {
  const compensation = useMemo((): CompensationDetails => {
    switch (markingType) {
      case 'self':
        return {
          totalFee: MARKING_FEES.OWNER_PAYS,
          userEarning: 0,
          newcondoEarning: 0,
          description: 'You mark your property yourself',
          breakdown: [
            {
              label: 'Payment from you',
              amount: MARKING_FEES.OWNER_PAYS,
              percentage: 100,
              icon: <User className="h-5 w-5" />,
            },
          ],
        };

      case 'known_person':
        if (isPropertyOwner) {
          return {
            totalFee: MARKING_FEES.OWNER_PAYS,
            userEarning: 0,
            newcondoEarning: MARKING_FEES.NEWCONDO_EARNS_FROM_OWNER,
            description: 'Someone you know marks your property',
            breakdown: [
              {
                label: 'You pay',
                amount: MARKING_FEES.OWNER_PAYS,
                percentage: 100,
                icon: <DollarSign className="h-5 w-5 text-red-500" />,
              },
              {
                label: 'Newcondo takes',
                amount: MARKING_FEES.NEWCONDO_EARNS_FROM_OWNER,
                percentage: 75,
                icon: <Building2 className="h-5 w-5 text-orange-500" />,
              },
            ],
          };
        } else {
          // Known person is the marker (agent/renter)
          return {
            totalFee: 0,
            userEarning: 0,
            newcondoEarning: 0,
            description: 'You are marking for someone you know',
            breakdown: [],
          };
        }

      case 'newcondo':
        if (isPropertyOwner) {
          return {
            totalFee: MARKING_FEES.NEWCONDO_MARKING_FEE,
            userEarning: 0,
            newcondoEarning: MARKING_FEES.NEWCONDO_MARKING_FEE,
            description: 'Newcondo marks your property professionally',
            breakdown: [
              {
                label: 'You pay',
                amount: MARKING_FEES.NEWCONDO_MARKING_FEE,
                percentage: 100,
                icon: <DollarSign className="h-5 w-5 text-red-500" />,
              },
              {
                label: 'Newcondo receives',
                amount: MARKING_FEES.NEWCONDO_MARKING_FEE,
                percentage: 100,
                icon: <Building2 className="h-5 w-5 text-green-500" />,
              },
            ],
          };
        }
        return {
          totalFee: 0,
          userEarning: 0,
          newcondoEarning: 0,
          description: 'Newcondo marks the property',
          breakdown: [],
        };

      case 'agent_network':
        if (!isPropertyOwner && (userRole === 'AGENT' || userRole === 'RENTER')) {
          // Agent or renter earning from marking
          return {
            totalFee: MARKING_FEES.OWNER_PAYS,
            userEarning: MARKING_FEES.AGENT_EARNS,
            newcondoEarning: MARKING_FEES.NEWCONDO_EARNS_FROM_OWNER,
            description: 'You mark property and earn commission',
            breakdown: [
              {
                label: 'Property owner pays',
                amount: MARKING_FEES.OWNER_PAYS,
                percentage: 100,
                icon: <DollarSign className="h-5 w-5 text-red-500" />,
              },
              {
                label: 'You earn',
                amount: MARKING_FEES.AGENT_EARNS,
                percentage: 25,
                icon: <TrendingUp className="h-5 w-5 text-green-500" />,
              },
              {
                label: 'Newcondo takes',
                amount: MARKING_FEES.NEWCONDO_EARNS_FROM_OWNER,
                percentage: 75,
                icon: <Building2 className="h-5 w-5 text-orange-500" />,
              },
            ],
          };
        } else if (isPropertyOwner) {
          // Property owner's perspective
          return {
            totalFee: MARKING_FEES.OWNER_PAYS,
            userEarning: 0,
            newcondoEarning: MARKING_FEES.NEWCONDO_EARNS_FROM_OWNER,
            description: 'An agent from our network marks your property',
            breakdown: [
              {
                label: 'You pay',
                amount: MARKING_FEES.OWNER_PAYS,
                percentage: 100,
                icon: <DollarSign className="h-5 w-5 text-red-500" />,
              },
              {
                label: 'Agent earns',
                amount: MARKING_FEES.AGENT_EARNS,
                percentage: 25,
                icon: <User className="h-5 w-5 text-green-500" />,
              },
              {
                label: 'Newcondo takes',
                amount: MARKING_FEES.NEWCONDO_EARNS_FROM_OWNER,
                percentage: 75,
                icon: <Building2 className="h-5 w-5 text-orange-500" />,
              },
            ],
          };
        }
        return {
          totalFee: 0,
          userEarning: 0,
          newcondoEarning: 0,
          description: 'Marking through agent network',
          breakdown: [],
        };

      default:
        return {
          totalFee: 0,
          userEarning: 0,
          newcondoEarning: 0,
          description: 'Unknown marking type',
          breakdown: [],
        };
    }
  }, [markingType, isPropertyOwner, userRole]);

  const totalBreakdownAmount = compensation.breakdown.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return (
    <div className="w-full space-y-4">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Compensation Breakdown
            </h3>
            <p className="mt-1 text-sm text-gray-600">{compensation.description}</p>
          </div>

          {/* Main Amount Display */}
          {compensation.totalFee > 0 && (
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              {isPropertyOwner ? (
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Amount
                  </p>
                  <p className="text-4xl font-bold text-gray-900">
                    ₦{compensation.totalFee.toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    You will pay this amount
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Your Earning
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    ₦{compensation.userEarning.toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Credited to your account
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Breakdown Details */}
          {compensation.breakdown.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Breakdown</h4>
              {compensation.breakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-100 p-2">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">
                        {item.percentage}% of total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₦{item.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              {/* Progress Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  {compensation.breakdown.map((item, index) => (
                    <div
                      key={index}
                      className={`${
                        index === 0
                          ? 'bg-red-500'
                          : index === 1
                            ? 'bg-green-500'
                            : 'bg-orange-500'
                      }`}
                      style={{
                        width: `${(item.amount / Math.max(totalBreakdownAmount, 1)) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Important Information:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    • You have 2-3 days to confirm the marking after it&apos;s completed
                  </li>
                  <li>
                    • Payment is held until you confirm the marking is correct
                  </li>
                  <li>
                    • If you don&apos;t confirm, a new marking job must be created and paid for
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};