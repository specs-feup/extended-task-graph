/*===============================================================*/
/*                                                               */
/*                         sgd_sw.cpp                            */
/*                                                               */
/*              Software version for spam filtering.             */
/*                                                               */
/*===============================================================*/
#include <cstdio>
#include <cassert>
#include "sgd_sw.h"
#include "math.h"
#include "synthcalls.h"

// Function to compute the dot product of data (feature) vector and parameter vector
FeatureType dotProduct(FeatureType param[NUM_FEATURES],
                       DataType    feature[NUM_FEATURES])
{
  FeatureType result = 0;
  DOT: for (int i = 0; i < NUM_FEATURES; i++)
    result += param[i] * feature[i];
  return result;
}

FeatureType Sigmoid(FeatureType exponent) 
{
  return 1.0f / (1.0f + expf(-exponent));
}

// Compute the gradient of the cost function
void computeGradient(
    FeatureType grad[NUM_FEATURES],
    DataType    feature[NUM_FEATURES],
    FeatureType scale)
{
  GRAD: for (int i = 0; i < NUM_FEATURES; i++)
    grad[i] = scale * feature[i];
}

// Update the parameter vector
void updateParameter(
    FeatureType param[NUM_FEATURES],
    FeatureType grad[NUM_FEATURES],
    FeatureType scale)
{
  UPDATE: for (int i = 0; i < NUM_FEATURES; i++)
    param[i] += scale * grad[i];
}

void SgdLR_sw( DataType    data[NUM_FEATURES * NUM_TRAINING],
               LabelType   label[NUM_TRAINING],
               FeatureType theta[NUM_FEATURES])
{
  // intermediate variable for storing gradient
  FeatureType gradient[NUM_FEATURES];

  // main loop
  // runs for multiple epochs
  EPOCH: for (int epoch = 0; epoch < NUM_EPOCHS; epoch ++) 
  {
    // in each epoch, go through each training instance in sequence
    TRAINING_INST: for( int training_id = 0; training_id < NUM_TRAINING; training_id ++ )
    { 
      // dot product between parameter vector and data sample 
      FeatureType dot = dotProduct(theta, &data[NUM_FEATURES * training_id]);
      // sigmoid
      FeatureType prob = Sigmoid(dot);
      // compute gradient
      computeGradient(gradient, &data[NUM_FEATURES * training_id], (prob - label[training_id]));
      // update parameter vector
      updateParameter(theta, gradient, -STEP_SIZE);
    }
  }
}


// top-level function 
void SgdLR_sw_with_debugging( DataType    data[NUM_FEATURES * NUM_TRAINING],
               LabelType   label[NUM_TRAINING],
               FeatureType theta[NUM_FEATURES],
               int8_t *printf_buf, async_kernel_info *printf_info,
               int8_t *assert0_buf, async_kernel_info *assert0_info,
               int8_t *assert1_buf, async_kernel_info *assert1_info)
{
  // intermediate variable for storing gradient
  FeatureType gradient[NUM_FEATURES];

  // main loop
  // runs for multiple epochs
  EPOCH: for (int epoch = 0; epoch < NUM_EPOCHS; epoch ++) 
  {
    // in each epoch, go through each training instance in sequence
    TRAINING_INST: for( int training_id = 0; training_id < NUM_TRAINING; training_id ++ )
    { 
      // dot product between parameter vector and data sample 
      FeatureType dot = dotProduct(theta, &data[NUM_FEATURES * training_id]);
      // sigmoid
      FeatureType prob = Sigmoid(dot);
      // compute gradient
      computeGradient(gradient, &data[NUM_FEATURES * training_id], (prob - label[training_id]));
      // update parameter vector
      updateParameter(theta, gradient, -STEP_SIZE);
    }
    int64_t printf_args[1] = {epoch};
    call_async_printf(printf_buf, printf_info, false, printf_args, 1);
  }
  close_async(printf_info);
  call_async_assert(assert0_buf, assert0_info, true, theta[0] > 2802.336181 && theta[0] < 2802.336183);
  call_async_assert(assert1_buf, assert1_info, true, theta[1023] > -8321.051759 && theta[1023] < -8321.051757);
}
