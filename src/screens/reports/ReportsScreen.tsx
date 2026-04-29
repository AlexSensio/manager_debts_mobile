import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from 'react-native-chart-kit';
import { dashboardService } from '../../services/dashboardService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';
import { MonthlyDebt, MonthlyReceived } from '../../types';

const screenWidth = Dimensions.get('window').width - spacing.lg * 2;

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type ChartType = 'lent' | 'received' | 'interest';

export default function ReportsScreen() {
  const [activeChart, setActiveChart] = useState<ChartType>('lent');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getGlobal,
  });

  // Monta os últimos 6 meses com dados
  const buildChartData = () => {
    const labels: string[] = [];
    const values: number[] = [];

    const monthlyDebts: MonthlyDebt[] = data?.monthlyData?.monthlyDebts || [];
    const monthlyReceived: MonthlyReceived[] = data?.monthlyData?.monthlyReceived || [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      labels.push(MONTH_NAMES[month - 1]);

      if (activeChart === 'lent') {
        const found = monthlyDebts.find((m) => m._id.year === year && m._id.month === month);
        values.push(found?.totalLent || 0);
      } else {
        const found = monthlyReceived.find((m) => m._id.year === year && m._id.month === month);
        values.push(found?.totalReceived || 0);
      }
    }

    return { labels, datasets: [{ data: values.length ? values : [0] }] };
  };

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: () => (activeChart === 'lent' ? colors.warning : colors.secondary),
    labelColor: () => colors.textSecondary,
    barPercentage: 0.65,
    decimalPlaces: 0,
    propsForBackgroundLines: { stroke: colors.divider },
  };

  const totals = data?.totals;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.secondary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Total cards */}
      <View style={styles.totalGrid}>
        <View style={[styles.totalCard, { borderTopColor: colors.warning }]}>
          <Text style={styles.totalCardLabel}>Total emprestado</Text>
          <Text style={[styles.totalCardValue, { color: colors.warning }]}>
            {formatCurrency(totals?.totalLent || 0)}
          </Text>
        </View>
        <View style={[styles.totalCard, { borderTopColor: colors.secondary }]}>
          <Text style={styles.totalCardLabel}>Total recebido</Text>
          <Text style={[styles.totalCardValue, { color: colors.secondary }]}>
            {formatCurrency(totals?.totalReceived || 0)}
          </Text>
        </View>
        <View style={[styles.totalCard, { borderTopColor: colors.info }]}>
          <Text style={styles.totalCardLabel}>Total de juros</Text>
          <Text style={[styles.totalCardValue, { color: colors.info }]}>
            {formatCurrency(totals?.totalInterest || 0)}
          </Text>
        </View>
        <View style={[styles.totalCard, { borderTopColor: colors.danger }]}>
          <Text style={styles.totalCardLabel}>A receber</Text>
          <Text style={[styles.totalCardValue, { color: colors.danger }]}>
            {formatCurrency(totals?.totalPending || 0)}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Evolução mensal (6 meses)</Text>

        <View style={styles.chartTabs}>
          {([['lent', 'Emprestado'], ['received', 'Recebido']] as [ChartType, string][]).map(
            ([type, label]) => (
              <View
                key={type}
                style={[styles.chartTab, activeChart === type && styles.chartTabActive]}
              >
                <Text
                  style={[styles.chartTabText, activeChart === type && styles.chartTabTextActive]}
                  onPress={() => setActiveChart(type)}
                >
                  {label}
                </Text>
              </View>
            )
          )}
        </View>

        {!isLoading && (
          <BarChart
            data={buildChartData()}
            width={screenWidth - spacing.lg * 2}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
            yAxisLabel="R$"
            yAxisSuffix=""
          />
        )}
      </View>

      {/* Summary details */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Resumo geral</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total de pessoas</Text>
          <Text style={styles.summaryValue}>{totals?.totalPeople || 0}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total de dívidas</Text>
          <Text style={styles.summaryValue}>{totals?.totalDebts || 0}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dívidas ativas</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {data?.debtsByStatus?.active || 0}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dívidas vencidas</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>
            {data?.debtsByStatus?.overdue || 0}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dívidas quitadas</Text>
          <Text style={[styles.summaryValue, { color: colors.secondary }]}>
            {data?.debtsByStatus?.paid || 0}
          </Text>
        </View>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  totalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  totalCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderTopWidth: 3,
    ...shadows.sm,
  },
  totalCardLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  totalCardValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  chartCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  chartTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chartTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  chartTabActive: { backgroundColor: colors.primary },
  chartTabText: { fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium },
  chartTabTextActive: { color: colors.textLight },
  chart: { borderRadius: borderRadius.sm, marginLeft: -spacing.md },
  summaryCard: {
    backgroundColor: colors.card,
    margin: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  summaryLabel: { fontSize: typography.sizes.md, color: colors.textSecondary },
  summaryValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
});
