"use client";

import { Button } from "@/components/base";
import { CustomCheckbox } from "@/components/base";
import { Switch } from "@/components/ui/switch";
import React, { useState } from "react";

const PriceMode = () => {
  const [checked, setChecked] = useState(false);
  const [isFixedPriceChecked, setIsFixedPriceChecked] = useState(false);
  const [isPriceRangeChecked, setIsPriceRangeChecked] = useState(false);
  const [isRFQChecked, setIsRFQChecked] = useState(false);

  return (
    <div className="card space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="medium3">Price Mode</h2>
          <p className="text-sm text-gray2">
            Toggle on and off to select which option gets available for use
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primaryLight"
            title="Restore To Default"
            className="!w-fit"
          />
          <Button title="Save Update" className="!w-fit" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={checked}
            onCheckedChange={() => setChecked(!checked)}
            title="On"
            id="on"
          />
          <label htmlFor="on">On</label>
        </div>
        <div>
          <CustomCheckbox
            checked={isFixedPriceChecked}
            onChange={() => setIsFixedPriceChecked(!isFixedPriceChecked)}
            label="Fixed price"
          />
          <p className="text-gray2 text-xs ml-4">
            Check on and off to include fixed price in the price mode option
          </p>
        </div>
        <div>
          <CustomCheckbox
            checked={isPriceRangeChecked}
            onChange={() => setIsPriceRangeChecked(!isPriceRangeChecked)}
            label="Price range"
          />
          <p className="text-gray2 text-xs ml-4">
            Check on and off to include price range in the price mode option
          </p>
        </div>
        <div>
          <CustomCheckbox
            checked={isRFQChecked}
            onChange={() => setIsRFQChecked(!isRFQChecked)}
            label="Request for quote"
          />
          <p className="text-gray2 text-xs ml-4">
            Check on and off to include RFQ in the price mode option
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceMode;

