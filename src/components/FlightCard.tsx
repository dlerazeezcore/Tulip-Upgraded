import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronUp, Plane } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { Flight, FareFamily } from '@/data/flights';

export function FlightCard({ flight }: { flight: Flight }) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [selectedFare, setSelectedFare] = useState<FareFamily['name']>('Light');

  return (
    <View
      style={{
        backgroundColor: t.bgElev,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: flight.color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
            {flight.airlineCode}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>
              {flight.depart}
            </Text>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: t.fgMuted }}>{flight.duration}</Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: t.borderStrong,
                  width: '100%',
                  marginTop: 4,
                  marginBottom: 4,
                  position: 'relative',
                }}
              >
                <Plane
                  size={11}
                  color={t.fgMuted}
                  style={{ position: 'absolute', left: '50%', top: -5, marginLeft: -5 }}
                />
              </View>
              <Text style={{ fontSize: 10, color: t.fgMuted }}>{flight.stops}</Text>
            </View>
            <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 17, color: t.fg }}>
              {flight.arrive}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: t.fgMuted }}>{flight.from}</Text>
            <Text style={{ fontSize: 11, color: t.fgMuted }}>
              {flight.airline} · {flight.number}
            </Text>
            <Text style={{ fontSize: 11, color: t.fgMuted }}>{flight.to}</Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: t.fgMuted }}>from</Text>
          <Text style={{ fontFamily: t.font.display, fontWeight: '700', fontSize: 18, color: t.fg }}>
            ${flight.price}
          </Text>
          {expanded ? (
            <ChevronUp size={16} color={t.fgMuted} />
          ) : (
            <ChevronDown size={16} color={t.fgMuted} />
          )}
        </View>
      </Pressable>

      {expanded && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: t.border,
            padding: 14,
            gap: 8,
            backgroundColor: t.bgSunken,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: t.fgMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Fare options
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {flight.fares.map((f) => {
              const on = selectedFare === f.name;
              return (
                <Pressable
                  key={f.name}
                  onPress={() => setSelectedFare(f.name)}
                  style={{
                    flexGrow: 1,
                    minWidth: 130,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: on ? t.primary : t.bgElev,
                    borderWidth: 1.5,
                    borderColor: on ? t.primary : t.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: t.font.display,
                      fontWeight: '700',
                      fontSize: 13,
                      color: on ? '#fff' : t.fg,
                    }}
                  >
                    {f.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: on ? '#fff' : t.fg,
                      marginTop: 4,
                    }}
                  >
                    ${f.price}
                  </Text>
                  <Text style={{ fontSize: 10, color: on ? 'rgba(255,255,255,0.85)' : t.fgMuted, marginTop: 4 }}>
                    {f.bag} · {f.changes === 'No' ? 'No changes' : `${f.changes} changes`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
