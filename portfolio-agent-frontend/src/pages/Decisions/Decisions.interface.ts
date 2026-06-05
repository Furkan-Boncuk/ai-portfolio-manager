export interface GoalItem {
  title: string;
  target: string;
  progress: string;
}

export interface StrategyConfigItem {
  name: string;
  type: string;
  timeframe: string;
}

export interface ThesisItem {
  title: string;
  status: string;
}

export interface MonitoringRuleItem {
  rule: string;
  enabled: boolean;
}

export interface DecisionsData {
  riskProfile: string;
  goals: GoalItem[];
  strategyConfigs: StrategyConfigItem[];
  theses: ThesisItem[];
  monitoringRules: MonitoringRuleItem[];
}
