import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Card, CardHeader, CardContent, Box, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { format } from 'date-fns';

const PIE_COLORS = ['#2E7D32', '#FF8F00'];

export default function StatsCharts({ stats }) {
  const byDay = stats?.byDay || [];
  const newVsRepeat = stats?.newVsRepeat || [];

  const dayLabels = byDay.map((d) => {
    try {
      return format(new Date(d.date), 'dd MMM');
    } catch {
      return d.date;
    }
  });
  const dayCounts = byDay.map((d) => d.count);

  const pieData = newVsRepeat.map((item, idx) => ({
    id: item.label,
    label: item.label,
    value: item.value,
    color: PIE_COLORS[idx % PIE_COLORS.length]
  }));

  const isEmpty = byDay.length === 0;

  // MUI X Charts defaults the legend to { vertical: 'top', horizontal: 'middle' },
  // which renders the "Sightings" label centered inside/above the plot area.
  // Move it below the chart instead, and give the chart extra bottom margin
  // so the legend never overlaps the x-axis labels.
  const bottomLegendProps = {
    position: { vertical: 'bottom', horizontal: 'middle' },
    direction: 'row'
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={7}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Sightings Over Time" titleTypographyProps={{ fontWeight: 700 }} />
          <CardContent>
            {isEmpty ? (
              <EmptyState />
            ) : (
              <LineChart
                height={300}
                xAxis={[{ scaleType: 'point', data: dayLabels }]}
                series={[{ data: dayCounts, label: 'Sightings', color: '#2E7D32', area: true, showMark: true }]}
                margin={{ left: 40, right: 20, top: 20, bottom: 60 }}
                grid={{ horizontal: true }}
                slotProps={{ legend: bottomLegendProps }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={5}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title="New vs Repeat" titleTypographyProps={{ fontWeight: 700 }} />
          <CardContent>
            {isEmpty ? (
              <EmptyState />
            ) : (
              <PieChart
                height={300}
                series={[{ data: pieData, innerRadius: 55, outerRadius: 110, paddingAngle: 2, cornerRadius: 4 }]}
                margin={{ left: 20, right: 20, top: 20, bottom: 60 }}
                slotProps={{ legend: bottomLegendProps }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Daily Sighting Volume" titleTypographyProps={{ fontWeight: 700 }} />
          <CardContent>
            {isEmpty ? (
              <EmptyState />
            ) : (
              <BarChart
                height={300}
                xAxis={[{ scaleType: 'band', data: dayLabels }]}
                series={[{ data: dayCounts, label: 'Sightings', color: '#FF8F00' }]}
                margin={{ left: 40, right: 20, top: 20, bottom: 60 }}
                slotProps={{ legend: bottomLegendProps }}
              />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

StatsCharts.propTypes = {
  stats: PropTypes.shape({
    byDay: PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string, count: PropTypes.number })),
    newVsRepeat: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.number }))
  })
};

function EmptyState() {
  return (
    <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        No data available for this range yet.
      </Typography>
    </Box>
  );
}
