import * as React from 'react';
import { ViewProps, TextProps, AnimatedValue } from 'react-native';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      View: ViewProps & React.PropsWithChildren;
      Text: TextProps & React.PropsWithChildren;
      ScrollView: any & React.PropsWithChildren;
      FlatList: any & React.PropsWithChildren;
      TouchableOpacity: any & React.PropsWithChildren;
      TextInput: any;
      Image: any;
      SafeAreaView: any & React.PropsWithChildren;
      'Animated.View': any & React.PropsWithChildren;
      'Animated.Text': any & React.PropsWithChildren;
    }
  }
}

export {};
