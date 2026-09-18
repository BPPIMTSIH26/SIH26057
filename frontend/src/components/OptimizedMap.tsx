/* eslint-disable react-refresh/only-export-components */
import React, { forwardRef } from 'react';
import { Map, Marker, Source, Layer, useMap } from './RawMap';

export const OptimizedMap = forwardRef<any, any>((props, ref) => {
  return <Map ref={ref} {...props} />;
});

export { Marker, Source, Layer, useMap };
export default OptimizedMap;
