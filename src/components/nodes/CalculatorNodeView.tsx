
'use client';

import React, { useState, useCallback } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const buttonClasses = "text-xl font-semibold h-14";
const operatorButtonClasses = "bg-accent text-accent-foreground hover:bg-accent/90";

export const CalculatorNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperatorClick = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setCurrentValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };
  
  const performCalculation = (): number => {
    const inputValue = parseFloat(display);
    if (currentValue === null || operator === null) return inputValue;

    let result = 0;
    switch (operator) {
      case '+': result = currentValue + inputValue; break;
      case '-': result = currentValue - inputValue; break;
      case '*': result = currentValue * inputValue; break;
      case '/': result = currentValue / inputValue; break;
      default: result = inputValue;
    }
    return result;
  };

  const handleEqualsClick = () => {
    if (operator === null) return;
    const result = performCalculation();
    setDisplay(String(result));
    setCurrentValue(result); // Allow chaining calculations
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleDecimalClick = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  return (
    <NodeViewWrapper className="my-4 inline-block">
      <Card className={cn("w-72 p-4 transition-shadow", selected && "ring-2 ring-primary shadow-lg")}>
        <CardContent className="p-0 space-y-4">
          <Input 
            value={display}
            readOnly
            className="h-16 text-4xl text-right font-mono bg-muted"
          />
          <div className="grid grid-cols-4 gap-2">
            <Button onClick={handleClear} className={cn(buttonClasses, "col-span-2 bg-destructive text-destructive-foreground hover:bg-destructive/90")}>AC</Button>
            <Button className={buttonClasses} onClick={() => setDisplay(String(parseFloat(display) * -1))}>+/-</Button>
            <Button className={cn(operatorButtonClasses, buttonClasses)} onClick={() => handleOperatorClick('/')}>÷</Button>

            <Button className={buttonClasses} onClick={() => handleDigitClick('7')}>7</Button>
            <Button className={buttonClasses} onClick={() => handleDigitClick('8')}>8</Button>
            <Button className={buttonClasses} onClick={() => handleDigitClick('9')}>9</Button>
            <Button className={cn(operatorButtonClasses, buttonClasses)} onClick={() => handleOperatorClick('*')}>×</Button>

            <Button className={buttonClasses} onClick={() => handleDigitClick('4')}>4</Button>
            <Button className={buttonClasses} onClick={() => handleDigitClick('5')}>5</Button>
            <Button className={buttonClasses} onClick={() => handleDigitClick('6')}>6</Button>
            <Button className={cn(operatorButtonClasses, buttonClasses)} onClick={() => handleOperatorClick('-')}>-</Button>

            <Button className={buttonClasses} onClick={() => handleDigitClick('1')}>1</Button>
            <Button className={buttonClasses} onClick={() => handleDigitClick('2')}>2</Button>
            <Button className={buttonClasses} onClick={() => handleDigitClick('3')}>3</Button>
            <Button className={cn(operatorButtonClasses, buttonClasses)} onClick={() => handleOperatorClick('+')}>+</Button>

            <Button className={cn(buttonClasses, "col-span-2")} onClick={() => handleDigitClick('0')}>0</Button>
            <Button className={buttonClasses} onClick={handleDecimalClick}>.</Button>
            <Button className={cn(operatorButtonClasses, buttonClasses)} onClick={handleEqualsClick}>=</Button>
          </div>
        </CardContent>
      </Card>
    </NodeViewWrapper>
  );
};
