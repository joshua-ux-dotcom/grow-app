import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import ScreenContainer from '../../components/ui/ScreenContainer';
import AppButton from '../../components/ui/AppButton';

const BENEFITS = [
  {
    key: 'personalized',
    title: 'Personalisiert',
    text: 'Antworten, die zu dir passen.',
    renderIcon: (scale) => (
      <Ionicons name="person-outline" size={18 * scale} color="#d7ab56" />
    ),
  },
  {
    key: 'intelligent',
    title: 'Intelligent',
    text: 'Lernt aus deinem Verhalten.',
    renderIcon: (scale) => (
      <MaterialCommunityIcons name="brain" size={18 * scale} color="#d7ab56" />
    ),
  },
  {
    key: 'private',
    title: 'Vertraulich',
    text: 'Deine Daten bleiben privat.',
    renderIcon: (scale) => (
      <Feather name="shield" size={18 * scale} color="#d7ab56" />
    ),
  },
];

function BenefitItem({ icon, title, text, scale }) {
  return (
    <View style={styles.benefitItem}>
      <View
        style={[
          styles.benefitIconWrap,
          {
            width: 40 * scale,
            height: 40 * scale,
            borderRadius: 20 * scale,
            marginBottom: 8 * scale,
          },
        ]}
      >
        {icon}
      </View>

      <Text
        style={[
          styles.benefitTitle,
          {
            fontSize: 12 * scale,
            marginBottom: 4 * scale,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.benefitText,
          {
            fontSize: 10 * scale,
            lineHeight: 13 * scale,
          },
        ]}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  );
}

export default function KIMentorScreen() {
  const { width, height } = useWindowDimensions();

  const scaleByHeight = Math.min(Math.max(height / 900, 0.82), 1);
  const scaleByWidth = Math.min(Math.max(width / 430, 0.9), 1);
  const scale = Math.min(scaleByHeight, scaleByWidth);

  return (
    <ScreenContainer
      style={[
        styles.container,
        {
          paddingHorizontal: 18 * scale,
          paddingTop: 12 * scale,
          paddingBottom: 10 * scale,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.brand,
            {
              fontSize: 18 * scale,
              marginBottom: 14 * scale,
            },
          ]}
        >
          GROW
        </Text>

        <View
          style={[
            styles.heroCard,
            {
              borderRadius: 24 * scale,
              padding: 18 * scale,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTextWrap}>
              <Text
                style={[
                  styles.overline,
                  {
                    fontSize: 12 * scale,
                    marginBottom: 4 * scale,
                  },
                ]}
              >
                DEIN PERSÖNLICHER
              </Text>

              <Text
                style={[
                  styles.title,
                  {
                    fontSize: 36 * scale,
                    lineHeight: 40 * scale,
                    marginBottom: 10 * scale,
                  },
                ]}
              >
                KI Mentor
              </Text>

              <View
                style={[
                  styles.badge,
                  {
                    paddingHorizontal: 12 * scale,
                    paddingVertical: 6 * scale,
                    borderRadius: 999,
                    marginBottom: 12 * scale,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      fontSize: 11.5 * scale,
                    },
                  ]}
                  numberOfLines={1}
                >
                  Dein Wachstum. Deine Regeln. Seine Führung.
                </Text>
              </View>

              <Text
                style={[
                  styles.intro,
                  {
                    fontSize: 13.5 * scale,
                    lineHeight: 19 * scale,
                  },
                ]}
                numberOfLines={4}
              >
                Der KI Mentor wird dich später bei Fokus, Motivation,
                Gewohnheiten und deiner persönlichen Entwicklung unterstützen.
              </Text>
            </View>

            <View
              style={[
                styles.heroIconWrap,
                {
                  width: 108 * scale,
                  height: 108 * scale,
                  borderRadius: 54 * scale,
                  marginLeft: 12 * scale,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="head-outline"
                size={68 * scale}
                color="#efc978"
              />
              <MaterialCommunityIcons
                name="tree-outline"
                size={18 * scale}
                color="#efc978"
                style={styles.treeIcon}
              />
            </View>
          </View>

          <View
            style={[
              styles.benefitsCard,
              {
                borderRadius: 18 * scale,
                paddingVertical: 14 * scale,
                paddingHorizontal: 12 * scale,
                marginTop: 18 * scale,
                marginBottom: 16 * scale,
              },
            ]}
          >
            {BENEFITS.map((benefit) => (
              <BenefitItem
                key={benefit.key}
                scale={scale}
                icon={benefit.renderIcon(scale)}
                title={benefit.title}
                text={benefit.text}
              />
            ))}
          </View>

          <View
            style={[
              styles.buildCard,
              {
                borderRadius: 18 * scale,
                padding: 14 * scale,
              },
            ]}
          >
            <View style={styles.buildTopRow}>
              <View
                style={[
                  styles.buildIconCircle,
                  {
                    width: 42 * scale,
                    height: 42 * scale,
                    borderRadius: 21 * scale,
                    marginRight: 10 * scale,
                  },
                ]}
              >
                <Feather name="tool" size={17 * scale} color="#efc978" />
              </View>

              <View style={styles.buildTextWrap}>
                <Text
                  style={[
                    styles.buildTitle,
                    {
                      fontSize: 16 * scale,
                      marginBottom: 4 * scale,
                    },
                  ]}
                >
                  Der KI Mentor entsteht gerade
                </Text>

                <Text
                  style={[
                    styles.buildText,
                    {
                      fontSize: 11 * scale,
                      lineHeight: 15 * scale,
                    },
                  ]}
                  numberOfLines={3}
                >
                  Wir entwickeln aktuell den wichtigsten Teil von Grow.
                  Die Freischaltung ist nach der Beta geplant.
                </Text>
              </View>
            </View>

            <AppButton
              title="Aktuell in Entwicklung"
              disabled
              style={{
                alignSelf: 'center',
                minHeight: 36 * scale,
                paddingHorizontal: 18 * scale,
                marginTop: 12 * scale,
              }}
              textStyle={{
                fontSize: 12 * scale,
              }}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },

  brand: {
    color: '#d7ab56',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },

  heroCard: {
    backgroundColor: '#090b11',
    borderWidth: 1,
    borderColor: '#2c2432',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  overline: {
    color: '#d7ab56',
    fontWeight: '700',
  },
  title: {
    color: '#f7f0df',
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#7f6236',
    backgroundColor: '#120d19',
  },
  badgeText: {
    color: '#e8c978',
    fontWeight: '600',
  },
  intro: {
    color: '#c9b79b',
    fontWeight: '500',
  },

  heroIconWrap: {
    backgroundColor: 'rgba(120, 74, 15, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  treeIcon: {
    position: 'absolute',
  },

  benefitsCard: {
    backgroundColor: '#0d0f16',
    borderWidth: 1,
    borderColor: '#24202b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  benefitItem: {
    flex: 1,
    alignItems: 'center',
  },
  benefitIconWrap: {
    borderWidth: 1,
    borderColor: '#7f6236',
    backgroundColor: '#120d19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    color: '#f4e7c5',
    fontWeight: '700',
    textAlign: 'center',
  },
  benefitText: {
    color: '#a89881',
    textAlign: 'center',
  },

  buildCard: {
    backgroundColor: '#0d0d12',
    borderWidth: 1,
    borderColor: '#a67931',
  },
  buildTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buildIconCircle: {
    borderWidth: 1,
    borderColor: '#7f6236',
    backgroundColor: '#171219',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildTextWrap: {
    flex: 1,
  },
  buildTitle: {
    color: '#f3d58b',
    fontWeight: '800',
  },
  buildText: {
    color: '#c2b095',
  },
});