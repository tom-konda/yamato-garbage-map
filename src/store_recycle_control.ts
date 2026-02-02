import type { IControl, Map } from 'maplibre-gl'

export class StoreRecycleControl implements IControl {

  #mapType:{
    'garbage': string,
    'recycle': string,
  };
  #selectedMapType: string;

  constructor() {
    this.#mapType = {
      'garbage': 'default',
      'recycle': 'default',
    }
    this.#selectedMapType = 'all';
  }

  onAdd(map: Map): HTMLElement {
    const wrapper = document.createElement('section');
    wrapper.classList.add('maplibregl-ctrl', 'maplibregl-ctrl-group')
    wrapper.id = 'store-recycle-control-wrapper';
    const template = document.querySelector<HTMLTemplateElement>('#store-recycle-control')?.content;
    template ? wrapper.append(template) : undefined;

    if (template) {
      wrapper.querySelectorAll<HTMLElement>(`#selected-data-options > div`).forEach(
        element => {
          element.style.display = 'none';
        }
      );
      map.setLayoutProperty('garbage_default', 'visibility', 'visible');
      map.setLayoutProperty('recycle_default', 'visibility', 'visible');

      wrapper.querySelectorAll<HTMLInputElement>('[name=data-type]').forEach(
        element => {
          element.addEventListener(
            'change',
            (e) => {
              const type = (e.target as HTMLInputElement).value as 'garbage'|'recycle'|'all';
              // 全て表示時はデフォルトのデータ表示
              if (type === 'all') {
                map.setLayoutProperty('garbage_default', 'visibility', 'visible');
                map.setLayoutProperty('recycle_default', 'visibility', 'visible');
                this.#selectedMapType = type;
                wrapper.querySelectorAll<HTMLElement>(`#selected-data-options > div`).forEach(
                  element => {
                    element.style.display = 'none';
                  }
                )
                return;
              }
              wrapper.querySelectorAll<HTMLElement>(`#selected-data-options > div`).forEach(
                element => {
                  element.style.display = 'none';
                  const divType = element.dataset.type as 'garbage'|'recycle';
                  if (this.#selectedMapType === 'all') {
                    map.setLayoutProperty(`${element.dataset.type}_default`, 'visibility', 'none');
                  }
                  else {
                    map.setLayoutProperty(`${element.dataset.type}_${this.#mapType[divType]}`, 'visibility', 'none');
                  }
                  if (element.dataset.type == type) {
                    element.style.display = '';
                    map.setLayoutProperty(`${type}_${this.#mapType[type]}`, 'visibility', 'visible');
                  }
                }
              );
              this.#selectedMapType = type;
            }
          )
        }
      );

      wrapper.querySelectorAll<HTMLSelectElement>('#selected-data-options select').forEach(
        element => {
          element.addEventListener(
            'change',
            (e) => {
              const selectElement = e.target as HTMLSelectElement;
              const value = selectElement.value;
              const type = selectElement.dataset.optionType as 'garbage'|'recycle';
              map.setLayoutProperty(`${type}_${this.#mapType[type]}`, 'visibility', 'none');
              map.setLayoutProperty(`${type}_${value}`, 'visibility', 'visible');
              this.#mapType[type] = value;
            }
          )
        }
      );
    }
    return wrapper;
  }
  onRemove(map: Map): void {
    throw new Error('Method not implemented.');
  }

}
