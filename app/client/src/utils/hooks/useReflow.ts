import { reflowMoveAction, stopReflowAction } from "actions/reflowActions";
import { OccupiedSpace, WidgetSpace } from "constants/CanvasEditorConstants";
import { debounce, isEmpty, throttle } from "lodash";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidgetSpacesSelectorForContainer } from "selectors/editorSelectors";
import { reflow } from "reflow";
import {
  CollidingSpace,
  CollidingSpaceMap,
  GridProps,
  MovementLimitMap,
  PrevReflowState,
  ReflowDirection,
  ReflowedSpaceMap,
  SecondOrderCollisionMap,
} from "reflow/reflowTypes";
import {
  getLimitedMovementMap,
  getSpacesMapFromArray,
} from "reflow/reflowUtils";
import { getBottomRowAfterReflow } from "utils/reflowHookUtils";
import { checkIsDropTarget } from "components/designSystems/appsmith/PositionedContainer";
import { getIsReflowing } from "selectors/widgetReflowSelectors";

type WidgetCollidingSpace = CollidingSpace & {
  type: string;
};

type WidgetCollidingSpaceMap = {
  horizontal: WidgetCollisionMap;
  vertical: WidgetCollisionMap;
};
export type WidgetCollisionMap = {
  [key: string]: WidgetCollidingSpace;
};

export interface ReflowInterface {
  (
    newPositions: OccupiedSpace[],
    direction: ReflowDirection,
    stopMoveAfterLimit?: boolean,
    shouldSkipContainerReflow?: boolean,
    forceDirection?: boolean,
    immediateExitContainer?: string,
  ): {
    movementLimitMap: MovementLimitMap | undefined;
    movementMap: ReflowedSpaceMap;
    bottomMostRow: number;
  };
}

export const useReflow = (
  OGPositions: OccupiedSpace[],
  parentId: string,
  gridProps: GridProps,
): ReflowInterface => {
  const dispatch = useDispatch();
  const isReflowingGlobal = useSelector(getIsReflowing);

  const throttledDispatch = throttle(dispatch, 50);

  const isReflowing = useRef<boolean>(false);

  const reflowSpacesSelector = getWidgetSpacesSelectorForContainer(parentId);
  const widgetSpaces: WidgetSpace[] = useSelector(reflowSpacesSelector) || [];

  const prevPositions = useRef<OccupiedSpace[] | undefined>(OGPositions);
  const prevCollidingSpaces = useRef<WidgetCollidingSpaceMap>();
  const prevMovementMap = useRef<ReflowedSpaceMap>({});
  const prevSecondOrderCollisionMap = useRef<SecondOrderCollisionMap>({});

  useEffect(() => {
    //debouncing to only have it run when the user has completely stopped reflow
    debounce(() => {
      if (!isReflowingGlobal) {
        isReflowing.current = false;
        prevPositions.current = [...OGPositions];
        prevCollidingSpaces.current = { horizontal: {}, vertical: {} };
        prevMovementMap.current = {};
        prevSecondOrderCollisionMap.current = {};
      }
    }, 300);
  }, [isReflowingGlobal]);

  // will become a state if we decide that resize should be a "toggle on-demand" feature
  const shouldResize = true;
  return function reflowSpaces(
    newPositions: OccupiedSpace[],
    direction: ReflowDirection,
    stopMoveAfterLimit = false,
    shouldSkipContainerReflow = false,
    forceDirection = false,
    immediateExitContainer?: string,
  ) {
    const prevReflowState: PrevReflowState = {
      prevSpacesMap: getSpacesMapFromArray(prevPositions.current),
      prevCollidingSpaceMap: prevCollidingSpaces.current as CollidingSpaceMap,
      prevMovementMap: prevMovementMap.current,
      prevSecondOrderCollisionMap: prevSecondOrderCollisionMap.current,
    };

    const {
      collidingSpaceMap,
      movementLimitMap,
      movementMap,
      secondOrderCollisionMap,
    } = reflow(
      newPositions,
      OGPositions,
      widgetSpaces,
      direction,
      gridProps,
      forceDirection,
      shouldResize,
      prevReflowState,
      immediateExitContainer,
    );

    prevPositions.current = newPositions;
    prevCollidingSpaces.current = collidingSpaceMap as WidgetCollidingSpaceMap;
    prevSecondOrderCollisionMap.current = secondOrderCollisionMap || {};

    let correctedMovementMap = movementMap || {};

    if (stopMoveAfterLimit)
      correctedMovementMap = getLimitedMovementMap(
        movementMap,
        prevMovementMap.current,
        { canHorizontalMove: true, canVerticalMove: true },
      );

    if (shouldSkipContainerReflow && collidingSpaceMap) {
      const collidingSpaces = [
        ...Object.values(collidingSpaceMap.horizontal),
        ...Object.values(collidingSpaceMap.vertical),
      ] as WidgetCollidingSpace[];

      for (const collidingSpace of collidingSpaces) {
        if (checkIsDropTarget(collidingSpace.type)) {
          correctedMovementMap = {};
        }
      }
    }

    prevMovementMap.current = correctedMovementMap;

    if (!isEmpty(correctedMovementMap)) {
      isReflowing.current = true;
      if (forceDirection) dispatch(reflowMoveAction(correctedMovementMap));
      else throttledDispatch(reflowMoveAction(correctedMovementMap));
    } else if (isReflowing.current) {
      isReflowing.current = false;
      throttledDispatch.cancel();
      dispatch(stopReflowAction());
    }

    const bottomMostRow = getBottomRowAfterReflow(
      movementMap,
      getBottomMostRow(newPositions),
      widgetSpaces,
      gridProps,
    );

    return {
      movementLimitMap,
      movementMap: correctedMovementMap,
      bottomMostRow,
    };
  };
};

function getBottomMostRow(newPositions: OccupiedSpace[]): number {
  return newPositions
    .map((space) => space.bottom)
    .reduce(
      (prevBottomRow, currentBottomRow) =>
        Math.max(prevBottomRow, currentBottomRow),
      0,
    );
}
