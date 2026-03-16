// src/types/enums.ts

export enum GaitPhase {
  HeelStrike = 'HeelStrike',
  FootFlat = 'FootFlat',
  MidStance = 'MidStance',
  HeelOff = 'HeelOff',
  ToeOff = 'ToeOff',
  MidSwing = 'MidSwing',
  TerminalSwing = 'TerminalSwing'
}

export enum SensorType {
  Accelerometer = 'Accelerometer',
  Gyroscope = 'Gyroscope',
  Magnetometer = 'Magnetometer'
}

export enum GravityLevel {
  Earth = 9.81,
  Moon = 1.62,
  Mars = 3.72,
  ZeroG = 0.0
}

export enum QuizType {
  MultipleChoice = 'MultipleChoice',
  TrueFalse = 'TrueFalse',
  FillInTheBlank = 'FillInTheBlank'
}
