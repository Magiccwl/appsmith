import React, { useContext } from "react";
import { pick } from "lodash";

import CheckboxComponent from "widgets/CheckboxWidget/component";
import Field from "widgets/FormBuilderWidget/component/Field";
import FormContext from "../FormContext";
import useEvents from "./useEvents";
import { AlignWidget } from "widgets/constants";
import {
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
} from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

type CheckboxComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    alignWidget: AlignWidget;
    onCheckChange?: string;
  };

type CheckboxFieldProps = BaseFieldComponentProps<CheckboxComponentProps>;

const COMPONENT_DEFAULT_VALUES: CheckboxComponentProps = {
  alignWidget: "LEFT",
  isDisabled: false,
  isVisible: true,
  label: "",
};

function CheckboxField({ name, schemaItem, ...rest }: CheckboxFieldProps) {
  const {
    isRequired,
    label,
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction } = useContext(FormContext);
  const { inputRef, registerFieldOnBlurHandler } = useEvents<HTMLInputElement>({
    onFocusDynamicString,
    onBlurDynamicString,
  });

  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      defaultValue={schemaItem.defaultValue}
      label={label}
      labelStyles={labelStyles}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => {
        const onCheckChange = (isChecked: boolean) => {
          onChange(isChecked);

          if (schemaItem.onCheckChange && executeAction) {
            executeAction({
              triggerPropertyName: "onCheckChange",
              dynamicString: schemaItem.onCheckChange,
              event: {
                type: EventType.ON_CHECK_CHANGE,
              },
            });
          }
        };

        registerFieldOnBlurHandler(onBlur);

        return (
          <CheckboxComponent
            alignWidget={schemaItem.alignWidget}
            inputRef={(e) => (inputRef.current = e)}
            isChecked={value}
            isDisabled={schemaItem.isDisabled}
            isLoading={false}
            isRequired={isRequired}
            label=""
            noContainerPadding
            onCheckChange={onCheckChange}
            // TODO: Handle default value of rowSpace
            rowSpace={20}
            widgetId=""
          />
        );
      }}
    />
  );
}

CheckboxField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default CheckboxField;
