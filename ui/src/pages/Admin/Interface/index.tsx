/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { FC, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/hooks';
import {
  LangsType,
  FormDataType,
  AdminSettingsInterface,
} from '@/common/interface';
import { interfaceStore, loggedUserInfoStore } from '@/stores';
import { JSONSchema, SchemaForm, UISchema } from '@/components';
import { DEFAULT_TIMEZONE, SYSTEM_AVATAR_OPTIONS } from '@/common/constants';
import {
  updateInterfaceSetting,
  useInterfaceSetting,
  getLoggedUserInfo,
} from '@/services';
import {
  setupAppLanguage,
  loadLanguageOptions,
  setupAppTimeZone,
} from '@/utils/localize';
import { handleFormError, scrollToElementTop } from '@/utils';

const Interface: FC = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'admin.interface',
  });
  const storeInterface = interfaceStore.getState().interface;
  const Toast = useToast();
  const [langs, setLangs] = useState<LangsType[]>();
  const { data: setting } = useInterfaceSetting();

  const schema: JSONSchema = {
    title: t('page_title'),
    properties: {
      language: {
        type: 'string',
        title: t('language.label'),
        description: t('language.text'),
        enum: langs?.map((lang) => lang.value),
        enumNames: langs?.map((lang) => lang.label),
        default:
          setting?.language || storeInterface.language || langs?.[0]?.value,
      },
      time_zone: {
        type: 'string',
        title: t('time_zone.label'),
        description: t('time_zone.text'),
        default: setting?.time_zone || DEFAULT_TIMEZONE,
      },
      default_avatar: {
        type: 'string',
        title: t('avatar.label'),
        description: t('avatar.text'),
        enum: SYSTEM_AVATAR_OPTIONS?.map((v) => v.value),
        enumNames: SYSTEM_AVATAR_OPTIONS?.map((v) => v.label),
        default: setting?.default_avatar || 'system',
      },
      gravatar_base_url: {
        type: 'string',
        title: t('gravatar_base_url.label'),
        description: t('gravatar_base_url.text'),
        default: setting?.gravatar_base_url || '',
      },
    },
  };

  const [formData, setFormData] = useState<FormDataType>({
    language: {
      value: setting?.language || storeInterface.language || langs?.[0]?.value,
      isInvalid: false,
      errorMsg: '',
    },
    time_zone: {
      value: setting?.time_zone || DEFAULT_TIMEZONE,
      isInvalid: false,
      errorMsg: '',
    },
    default_avatar: {
      value: setting?.default_avatar || 'system',
      isInvalid: false,
      errorMsg: '',
    },
    gravatar_base_url: {
      value: setting?.gravatar_base_url || '',
      isInvalid: false,
      errorMsg: '',
    },
  });

  const uiSchema: UISchema = {
    language: {
      'ui:widget': 'select',
    },
    time_zone: {
      'ui:widget': 'timezone',
    },
    default_avatar: {
      'ui:widget': 'select',
    },
    gravatar_base_url: {
      'ui:widget': 'input',
      'ui:options': {
        placeholder: 'https://www.gravatar.com/avatar/',
      },
    },
  };
  const getLangs = async () => {
    const res: LangsType[] = await loadLanguageOptions(true);
    setLangs(res);
  };

  const checkValidated = (): boolean => {
    let ret = true;
    const { language } = formData;
    const formCheckData = { ...formData };
    if (!language.value) {
      ret = false;
      formCheckData.language = {
        value: '',
        isInvalid: true,
        errorMsg: t('language.msg'),
      };
    }
    setFormData({
      ...formCheckData,
    });
    return ret;
  };
  const onSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    if (checkValidated() === false) {
      return;
    }
    const reqParams: AdminSettingsInterface = {
      language: formData.language.value,
      time_zone: formData.time_zone.value,
      default_avatar: formData.default_avatar.value,
      gravatar_base_url: formData.gravatar_base_url.value,
    };

    updateInterfaceSetting(reqParams)
      .then(() => {
        interfaceStore.getState().update(reqParams);
        setupAppLanguage();
        setupAppTimeZone();
        getLoggedUserInfo().then((info) => {
          loggedUserInfoStore.getState().update(info);
        });
        Toast.onShow({
          msg: t('update', { keyPrefix: 'toast' }),
          variant: 'success',
        });
      })
      .catch((err) => {
        if (err.isError) {
          const data = handleFormError(err, formData);
          setFormData({ ...data });
          const ele = document.getElementById(err.list[0].error_field);
          scrollToElementTop(ele);
        }
      });
  };

  useEffect(() => {
    if (setting) {
      const formMeta = {};
      Object.keys(setting).forEach((k) => {
        let v = setting[k];
        if (k === 'default_avatar' && !v) {
          v = 'system';
        }
        if (k === 'gravatar_base_url' && !v) {
          v = '';
        }
        formMeta[k] = { ...formData[k], value: v };
      });
      setFormData({ ...formData, ...formMeta });
    }
  }, [setting]);
  useEffect(() => {
    getLangs();
  }, []);

  const handleOnChange = (data) => {
    setFormData(data);
  };
  return (
    <>
      <h3 className="mb-4">{t('page_title')}</h3>
      <SchemaForm
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        onSubmit={onSubmit}
        onChange={handleOnChange}
      />
    </>
  );
};

export default Interface;
