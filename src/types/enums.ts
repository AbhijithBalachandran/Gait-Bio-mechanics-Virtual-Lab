// src/types/enums.ts

export enum GaitPhase {
  HeelStrike = 'HeelStrike',
  FootFlat = 'FootFlat',
  MidStance = 'MidStance',
  HeelOff = 'HeelOff',
  ToeOff = 'ToeOff',
  MidSwing = 'MidSwing',
  TerminalSwing = 'TerminalSwing',
}

export enum SensorType {
  IMU_Foot = 'IMU_Foot',
  IMU_Shank = 'IMU_Shank',
  IMU_Thigh = 'IMU_Thigh',
  FSR_Heel = 'FSR_Heel',
  FSR_Toe = 'FSR_Toe',
}

export enum GravityLevel {
  Earth = 9.81,
  Moon = 1.62,
  Mars = 3.72,
  Jupiter = 24.79,
  ISS = 0.0001,
}

export enum QuizType {
  MultipleChoice = 'mc',
  DragDrop = 'dragdrop',
  FillIn = 'fillin',
}
