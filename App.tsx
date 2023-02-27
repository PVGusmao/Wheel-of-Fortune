import { StatusBar } from 'expo-status-bar';
import { Animated, Dimensions, Image, StyleSheet, Text as RNText, TouchableOpacity, View } from 'react-native';
import Svg, { Path, G, Text, TSpan } from 'react-native-svg';
import { PanGestureHandler, State} from 'react-native-gesture-handler';
import * as d3Shape from 'd3-shape';
import color from 'randomcolor';
import { snap } from '@popmotion/popcorn';
import { useEffect, useState } from 'react';
import pin from './assets/free-pin-icon-48-thumb.png';

const {width} = Dimensions.get('screen');

const numberOfSegments = 10;
const wheelSize = width * 0.9;
const fontSize = 26;
const oneTurn = 360;
const angleBySegment = oneTurn / numberOfSegments;
const angleOffSet = angleBySegment / 2;

const makeWheel = () => {
  const data = Array.from({length: numberOfSegments}).fill(1);
  const arcs = d3Shape.pie()(data);
  const colors = color({
    luminosity: 'dark',
    count: numberOfSegments,
  })

  return arcs.map((arc, index) => {
    const instance = d3Shape
    .arc()
    .padAngle(0.01)
    .outerRadius( width / 2)
    .innerRadius(20)

    return {
      path: instance(arc),
      color: colors[index],
      value: Math.round(Math.random() * 10 + 1) * 200,
      centroid: instance.centroid(arc),
    }

  })
}

export default function App() {
  const _wheelPaths = makeWheel();
  const _angle = new Animated.Value(0);
  const [state, setState] = useState(true);
  const [winner, setWinner] = useState(0);
  const [finish, setFinish] = useState(false);

  let angle = 0;

  useEffect(() => {
    _angle.addListener(event => {
      if (state) {
        setState(false);
      }

      angle = event.value
    })
  }, [])

  function _renderSvgWheel() {
    return (
      <View style={styles.container}>
        {_renderKnob()}
        <Animated.View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              {
                rotate: _angle.interpolate({
                  inputRange: [-oneTurn, 0, oneTurn],
                  outputRange: [`-${oneTurn}deg`, '0deg', `${oneTurn}deg`]
                })
              }
            ]
          }}
        >
          <Svg
            width={wheelSize}
            height={wheelSize}
            viewBox={`0 0 ${width} ${width}`}
            style={{transform: [{rotate: `-${angleOffSet}deg`}]}}
          >
            <G y={width / 2} x={ width / 2}>
              {_wheelPaths.map((arc, i) => {
                const [x, y] = arc.centroid;
                const number = arc.value.toString();
                
                return (
                  <G
                    key={`arc-${i}`}
                  >
                    <Path d={arc.path} fill={arc.color}/>

                    <G
                      rotation={(i * oneTurn) / numberOfSegments + angleOffSet}
                      origin={`${x}, ${y}`}
                    >
                      <Text
                        fontSize={fontSize}
                        x={x}
                        y={y - 70}
                        fill='white'
                        textAnchor='middle'
                      >
                        {Array.from({length: number.length}).map((_, j) => {
                          return (
                            <TSpan
                              key={`arc-${i}-slice-${j}`}
                              x={x}
                              y={y}
                            >
                              {'ola'}
                            </TSpan>
                          )
                        })}
                      </Text>
                    </G>
                  </G>
                )
              })}
            </G>
          </Svg>
        </Animated.View>
      </View>
    )
  }

  const _getWinnerIndex = () => {
    const deg = Math.abs(Math.round(angle % oneTurn));
    return Math.floor(deg / angleBySegment);
  }
  
  const _onPan = ({nativeEvent}) => {
    console.log(nativeEvent.state);
    if (5 === State.END) {
      const { velocityY } = nativeEvent;

      Animated.decay(_angle, {
        velocity: 3000 / 1000,
        deceleration: 0.9984,
        useNativeDriver: true
      }).start(() => {
        _angle.setValue(angle % oneTurn);
        const snapTo = snap(oneTurn / numberOfSegments);
        Animated.timing(_angle, {
          toValue: snapTo(angle),
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          const winnerIndex = _getWinnerIndex();
          setState(true);
          setWinner(_wheelPaths[winnerIndex].value);
          setFinish(true);
        })
      })
    }
  }

  function _renderWinner() {
    return (
      <RNText style={styles.winnerText}>Winner is: {winner}</RNText>
    )
  }

  function _renderKnob() {
    const yolo = Animated.modulo(Animated.divide(Animated.modulo(
      Animated.subtract(_angle, angleOffSet), oneTurn
    ), new Animated.Value(angleBySegment)), 1)

    return (
      <Animated.View
        style={{
          justifyContent: 'flex-end',
          zIndex: 1,
          transform: [
            {
              rotate: yolo.interpolate({
                inputRange: [-1, -0.45, -0.0001, 0.001, 0.45, 1],
                outputRange: ['0deg', '0deg', '35deg', '-35deg', '0deg', '0deg'],
              }),
            }
          ]
        }}
      >
        <Image style={{
          width: 40,
          height: 60,
          transform: [{ translateY: 18 }]
        }} source={pin} />
      </Animated.View>
    )
  }

  return (
    <>
      <PanGestureHandler
        onHandlerStateChange={_onPan}
        disabled={state}
      >
        <View style={styles.container}>
          {_renderSvgWheel()}
          {finish && state && _renderWinner()}
        </View>
      </PanGestureHandler>
    
      <TouchableOpacity
        style={{ backgroundColor: 'red', height: 50, width: 150 }}
        onPress={_onPan}>
        <RNText>Spin that wheel!!!</RNText>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerText: {
    fontSize: 32,
    position: 'absolute',
    bottom: 10,
  },
});
