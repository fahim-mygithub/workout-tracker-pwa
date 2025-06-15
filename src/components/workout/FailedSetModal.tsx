import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { markSetAsFailed } from '../../store/slices/workoutSlice';
import {
  Modal,
  Typography,
  Button,
  Flex,
  Input,
  Card,
  CardContent,
} from '../ui';
import { AlertTriangle, TrendingDown } from 'lucide-react';

interface FailedSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseIndex: number;
  setIndex: number;
  currentWeight?: number;
  backoffPercentage?: number;
}

export const FailedSetModal: React.FC<FailedSetModalProps> = ({
  isOpen,
  onClose,
  exerciseIndex,
  setIndex,
  currentWeight = 0,
  backoffPercentage = 10,
}) => {
  const dispatch = useDispatch();
  const [rpe, setRpe] = useState<number>(8);
  const [reason, setReason] = useState<string>('');

  const handleMarkAsFailed = () => {
    dispatch(markSetAsFailed({
      exerciseIndex,
      setIndex,
      rpe,
    }));
    onClose();
    // Reset form
    setRpe(8);
    setReason('');
  };

  const newWeight = currentWeight > 0 ? Math.round(currentWeight * (1 - backoffPercentage / 100)) : 0;

  const rpeDescriptions: Record<number, string> = {
    1: 'Very Light - Could do many more reps',
    2: 'Light - Could do many more reps',
    3: 'Moderate - Could do several more reps',
    4: 'Moderate - Could do several more reps',
    5: 'Moderate - Could do a few more reps',
    6: 'Hard - Could do 4 more reps',
    7: 'Hard - Could do 2-3 more reps',
    8: 'Very Hard - Could do 1-2 more reps',
    9: 'Extremely Hard - Could do 1 more rep',
    10: 'Maximum - Could not do any more reps',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Set as Failed"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <Typography variant="body2" className="text-orange-800">
            This will mark the set as failed and apply automatic weight reduction
          </Typography>
        </div>

        {/* RPE Input */}
        <div>
          <Typography variant="h6" className="font-medium mb-2">
            Rate of Perceived Exertion (RPE)
          </Typography>
          <Typography variant="body2" color="secondary" className="mb-3">
            How hard did this set feel on a scale of 1-10?
          </Typography>
          
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[6, 7, 8, 9, 10].map((value) => (
              <Button
                key={value}
                variant={rpe === value ? "primary" : "outline"}
                size="sm"
                onClick={() => setRpe(value)}
                className="h-12 flex flex-col"
              >
                <span className="text-lg font-bold">{value}</span>
              </Button>
            ))}
          </div>
          
          <Typography variant="body2" color="secondary" className="text-center">
            {rpeDescriptions[rpe]}
          </Typography>
        </div>

        {/* Weight Adjustment Preview */}
        {currentWeight > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <Typography variant="body2" className="font-medium">
                  Automatic Weight Adjustment
                </Typography>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-gray-600">Current</div>
                  <div className="font-semibold">{currentWeight} lbs</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Reduction</div>
                  <div className="font-semibold text-red-600">-{backoffPercentage}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">New Weight</div>
                  <div className="font-semibold text-blue-600">{newWeight} lbs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optional Reason */}
        <div>
          <Typography variant="body2" className="font-medium mb-2">
            Reason (Optional)
          </Typography>
          <Input
            placeholder="e.g., form breakdown, fatigue, injury..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full"
          />
        </div>

        <Flex gap="sm" justify="end">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleMarkAsFailed}
          >
            Mark as Failed
          </Button>
        </Flex>
      </div>
    </Modal>
  );
};