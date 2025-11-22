declare module 'react-stepper-horizontal' {
  import { Component } from 'react';

  interface Step {
    title: string;
    href?: string;
    onClick?: () => void;
  }

  interface StepperProps {
    steps: Step[];
    activeStep?: number;
    activeColor?: string;
    completeColor?: string;
    defaultColor?: string;
    circleFontSize?: number;
    titleFontSize?: number;
    size?: number;
    circleTop?: number;
    titleTop?: number;
    defaultTitleColor?: string;
    activeTitleColor?: string;
    completeTitleColor?: string;
    defaultBarColor?: string;
    completeBarColor?: string;
    barStyle?: string;
    lineMarginOffset?: number;
    defaultBorderColor?: string;
    completeBorderColor?: string;
    activeBorderColor?: string;
    defaultBorderStyle?: string;
    completeBorderStyle?: string;
    activeBorderStyle?: string;
    defaultBorderWidth?: number;
    completeBorderWidth?: number;
    activeBorderWidth?: number;
    lineStyle?: string;
    defaultOpacity?: string;
    completeOpacity?: string;
    activeOpacity?: string;
    defaultTitleOpacity?: string;
    completeTitleOpacity?: string;
    activeTitleOpacity?: string;
    continueBtn?: boolean;
    backBtn?: boolean;
    onSubmit?: () => void;
    finishBtnText?: string;
    nextBtnText?: string;
    prevBtnText?: string;
    fontFamily?: string;
    onClick?: (step: number) => void;
  }

  export default class Stepper extends Component<StepperProps> {}
}

