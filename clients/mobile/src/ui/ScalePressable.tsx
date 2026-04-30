import { MotiPressable } from 'moti/interactions';
import type { ComponentProps } from 'react';

type MotiPressableProps = ComponentProps<typeof MotiPressable>;

type ScalePressableProps = MotiPressableProps & {
  scaleTo?: number;
  className?: string;
};

export function ScalePressable({ scaleTo = 0.98, animate, transition, ...props }: ScalePressableProps) {
  return (
    <MotiPressable
      animate={(state) => ({
        scale: state.pressed ? scaleTo : 1,
        ...(typeof animate === 'function' ? animate(state) : animate),
      })}
      transition={transition}
      {...(props as MotiPressableProps)}
    />
  );
}
